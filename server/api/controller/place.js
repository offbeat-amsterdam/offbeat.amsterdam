const { Place, Event } = require('../models/models')

const eventController = require('./event')
const exportController = require('./export')

const log = require('../../log')
const { Op, where, col, fn, cast } = require('sequelize')

module.exports = {

  async getEvents (req, res) {
    // this api returned the events of a selected location by name (now it is by id)
    // but we maintain backward compatibility
    const name = req.params.placeNameOrId
    const id = Number(req.params.placeNameOrId)
    const place = await Place.findOne({ where: { ...(isNaN(id) ? { name } : { id })}})
    
    if (!place) {
      log.warn(`Place ${name} not found`)
      return res.sendStatus(404)
    }

    const format = req.params.format || 'json'

    log.debug(`Events for place: ${place.name}`)
    const filter = { places: String(place.id) }
    switch (format) {
      case 'rss': {
        const { events } = await eventController._selectUpcoming(filter)
        return exportController.feed(req, res, events,
            `${res.locals.settings.title} - Place @${place.name}`,
            `${res.locals.settings.baseurl}/feed/rss/place/${place.id}`)
      }
      case 'ics': {
        const { events } = await eventController._selectUpcoming(filter)
        return exportController.ics(req, res, events)
      }
      default: {
        const page = eventController._pageParam(req, 'page')
        const pastPage = eventController._pageParam(req, 'past_page')
        // "load more" on the place page: only the list being extended
        if (page > 0) {
          return res.json(await eventController._selectUpcoming({ ...filter, page, start: req.query.start }))
        }
        if (pastPage > 0) {
          return res.json(await eventController._selectPast({ ...filter, page: pastPage }))
        }
        const [upcoming, past] = await Promise.all([
          eventController._selectUpcoming({ ...filter, page, start: req.query.start }),
          eventController._selectPast({ ...filter, page: pastPage })
        ])
        return res.json({ ...upcoming, ...past, place })
      }
    }
  },


  async updatePlace (req, res) {
    const place = await Place.findByPk(req.body.id)
    await place.update(req.body)
    res.json(place)
  },

  async getAll (_req, res) {
    const places = await Place.findAll({
      order: [[cast(fn('COUNT', col('events.placeId')),'INTEGER'), 'DESC']],
      include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
      group: ['place.id'],
      raw: true
    })
    return res.json(places)
  },

  async search (req, res) {
    const search = req.query?.search?.toLocaleLowerCase() ?? ''
    const places = await Place.findAll({
      order: [[cast(fn('COUNT', col('events.placeId')),'INTEGER'), 'DESC']],
      where: {
        [Op.or]: [
          { name: where(fn('LOWER', col('name')), 'LIKE', '%' + search + '%' )},
          { address: where(fn('LOWER', col('address')), 'LIKE', '%' + search + '%')},
        ]
      },
      attributes: ['name', 'address', 'latitude', 'longitude', 'id'],
      include: [{ model: Event, where: { is_visible: true, ap_id: null }, required: true, attributes: [] }],
      group: ['place.id'],
      raw: true,
      limit: 10,
      subQuery: false
    })

    // TOFIX: don't know why limit does not work
    return res.json(places.slice(0, 10))
  }

}
