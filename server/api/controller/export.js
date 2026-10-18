const { Event, Place, Tag } = require('../models/models')

const { htmlToText } = require('html-to-text')
const { Op, literal } = require('sequelize')
const { DateTime } = require('luxon')
const ics = require('ics')
const collectionController = require('./collection')
const { queryParamToBool } = require('../../helpers')

const cachedFeedResponses = new Map()
const pendingFeedResponses = new Map()
const feedCacheTtl = 30 * 1000
const maxCachedFeeds = 8

// Feeds are rendered to { status, contentType, body } so they can be cached
// and sent later, possibly to a different request than the one rendering them.
function sendRendered (res, response) {
  return res.status(response.status || 200).type(response.contentType).send(response.body)
}

function renderFeed (res, events, title = res.locals.settings.title, link = `${res.locals.settings.baseurl}/feed/rss`) {
  const settings = res.locals.settings
  const opt = { zone: settings.instance_timezone, locale: settings.instance_locale }
  const unixFormat = (timestamp, format = 'EEEE d MMMM HH:mm') =>
    DateTime.fromSeconds(timestamp, opt).toFormat(format)

  return new Promise((resolve, reject) => {
    res.render('feed/rss.pug', { events, settings, unixFormat, title, link }, (err, body) => {
      if (err) return reject(err)
      resolve({ contentType: 'application/rss+xml; charset=UTF-8', body })
    })
  })
}

/**
 * render an ics of specified events (optionally with reminders)
 * @param {*} events array of events from sequelize
 * @param {*} alarms https://github.com/adamgibbons/ics#attributes (alarms)
 */
function renderIcs (events, settings, alarms = []) {
  const eventsMap = events.map(e => {

    const tmpStart = DateTime.fromSeconds(e.start_datetime, { zone: 'UTC' })
    const start = [ tmpStart.year, tmpStart.month, tmpStart.day, tmpStart.hour, tmpStart.minute ]

    // 'online' is how a multi venue event is stored, and several venues have
    // no one address to put in LOCATION. Anything else would be a URL, which
    // a calendar app will happily offer to navigate to.
    const location = e?.place
      ? (e.place?.name !== 'online' ? `${e.place?.name} - ${e.place?.address}` : 'Multiple Locations')
      : ''
    const ret = {
      uid: `${e.id}@${settings.hostname}`,
      start,
      startInputType: 'utc',
      endInputType: 'utc',
      title: e.title,
      description: htmlToText(e.description),
      htmlContent: e.description && e.description.replace(/\n/g,"<br>"),
      location,
      url: `${settings.baseurl}/event/${e.slug || e.id}`,
      status: 'CONFIRMED',
      categories: e.tags.map(t => t.tag || t),
      alarms
    }

    if (e.place?.latitude && e.place?.longitude) {
      ret.geo = { lat: e.place.latitude, lon: e.place.longitude }
    }

    if (e.end_datetime) {
      const tmpEnd = DateTime.fromSeconds(e.end_datetime, { zone: 'UTC' })
      const end = [ tmpEnd.year, tmpEnd.month, tmpEnd.day, tmpEnd.hour, tmpEnd.minute ]
      ret.end = end
    }

    return ret
  })

  return new Promise(resolve => {
    ics.createEvents(eventsMap, (err, body) => {
      resolve(err
        ? { status: 401, contentType: 'text/plain; charset=UTF-8', body: String(err) }
        : { contentType: 'text/calendar; charset=UTF-8', body })
    })
  })
}

const exportController = {

  async export (req, res) {
    const settings = res.locals.settings
    const format = req.params.format || 'json'
    const tags = req.query.tags
    const places = req.query.places
    const collection = req.query?.collection ?? settings.collection_in_home
    const show_recurrent = settings.allow_recurrent_event && queryParamToBool(req.query?.show_recurrent, settings.recurrent_event_visible)

    const opt = {
      zone: settings.instance_timezone,
      locale: settings.instance_locale
    }

    const where = {}
    const yesterday = DateTime.local(opt).minus({day: 1}).toUnixInteger()

    if (!collection) {

      if (tags && places) {
        where[Op.or] = {
          placeId: places ? places.split(',').map(Number).filter(a => a) : [],
          '$tags.tag$': tags.split(',')
        }
      }

      if (tags) {
        where['$tags.tag$'] = tags.split(',')
      }

      if (places) {
        where.placeId = places.split(',').map(Number).filter(a => a)
      }

    }

    if (!show_recurrent) {
      where.parentId = null
    }

    const loadEvents = async () => {
      if (collection) {
        return collectionController._getEvents({ name: collection })
      }
      return Event.findAll({
        order: ['start_datetime'],
        attributes: { exclude: ['is_visible', 'recurrent', 'createdAt', 'likes', 'boost', 'userId', 'placeId'] },
        where: {
          is_visible: true,
          recurrent: null,
          apUserApId: null,
          start_datetime: { [Op.gte]: yesterday },
          ...where
        },
        include: [
          {
            model: Tag,
            order: [literal('(SELECT COUNT("tagTag") FROM event_tags WHERE tagTag = tag) DESC')],
            attributes: ['tag'],
            required: !!tags,
            through: { attributes: [] }
          },
          { model: Place, attributes: ['name', 'id', 'address'] }]
      })
    }

    if (format === 'json') {
      return res.json(await loadEvents())
    }
    if (!['rss', 'feed', 'ics'].includes(format)) {
      return res.status(404).send('Please specify a valid format: rss, feed, ics or json')
    }

    const render = async () => {
      const events = await loadEvents()
      return format === 'ics' ? renderIcs(events, settings) : renderFeed(res, events.slice(0, 20))
    }

    // Cache only the unfiltered default feeds. A short cache shields the
    // unbounded calendar export from repeated crawler requests while keeping
    // edits visible within half a minute. Share in-flight work on cache misses.
    const cacheable = !tags && !places && !req.query.collection
    if (!cacheable) return sendRendered(res, await render())

    const cacheKey = `${format}:${collection || ''}:${show_recurrent}`
    const cached = cachedFeedResponses.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return sendRendered(res, cached.response)
    }
    if (cached) cachedFeedResponses.delete(cacheKey)

    let pending = pendingFeedResponses.get(cacheKey)
    if (!pending) {
      pending = render()
      pendingFeedResponses.set(cacheKey, pending)
    }

    try {
      const response = await pending
      if ((response.status || 200) < 400) {
        if (cachedFeedResponses.size >= maxCachedFeeds) {
          cachedFeedResponses.delete(cachedFeedResponses.keys().next().value)
        }
        cachedFeedResponses.set(cacheKey, { response, expiresAt: Date.now() + feedCacheTtl })
      }
      return sendRendered(res, response)
    } finally {
      if (pendingFeedResponses.get(cacheKey) === pending) pendingFeedResponses.delete(cacheKey)
    }
  },

  async feed (_req, res, events, title, link) {
    return sendRendered(res, await renderFeed(res, events, title, link))
  },

  async ics (_req, res, events, alarms = []) {
    return sendRendered(res, await renderIcs(events, res.locals.settings, alarms))
  }
}

module.exports = exportController
