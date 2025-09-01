/**
 * This is a beta ics feed importer
 */

const axios = require('axios')
const Sequelize = require('sequelize')

const plugin = {
  configuration: {
    name: 'Feed',
    author: 'lesion',
    url: 'https://framagit.org/les/gancio',
    description: 'Get events from a specified ics feed, this is a beta release of this plugin: you can specify only a single feed, images are not imported from ics, event location are taken as is as are not structured in ics, read the code',
    settings: {
      refresh_minutes: {
        type: 'NUMBER',
        description: 'Refresh the feed each N minutes, if 0 refreshes only at startup',
        required: true,
        hint: '60 minutes?'
      },
      feed_URL: {
        type: 'TEXT',
        description: 'ICS feed URL',
        required: true,
        hint: 'Check it before'
      },
      include_past: {
        type: 'CHECK',
        description: 'Include events in the past',
        required: true,
      },
      add_tag: {
        type: 'TEXT',
        description: 'Add this tag to each imported event',
        required: false,
      }
    }
  },

  gancio: null, // { helpers, log, settings }
  log: null,
  settings: null,
  db: null,
  interval: null,
  ETag: null,

  load(gancio, settings) {
    plugin.gancio = gancio // contains all gancio settings, including all plugins settings
    plugin.log = gancio.log // just the logger
    plugin.db = gancio.db
    plugin.settings = settings // this plugin settings

    plugin.log.info("Feed plugin loaded!")
    plugin.apiBaseUrl = gancio.settings.baseurl + '/api'
    plugin.log.debug(`[FEED Plugin] Using API base: ${plugin.apiBaseUrl}`)

    // TODO: could use the TaskManager?
    if (settings.refresh_minutes > 0) {
      plugin.interval = setInterval(this._tick, settings.refresh_minutes*1000*60)
    } else {
      this._tick()
    }
  },

  unload () {
    plugin.log.debug('[FEED Plugin] Clear interval an unload plugin')
    clearInterval(plugin.interval)
  },

  onTest () {
    plugin._tick()
  },

  async _tick () {
    // Avoid running multiple ticks at the same time which could cause race conditions on the database
    if (plugin._isTickRunning) {
      plugin.log.warn('[FEED Plugin] _tick already in progress, skipping')
      return
    }
    plugin.log.debug('[FEED Plugin] _tick started, locking it')
    plugin._isTickRunning = true

    try {
      if (!plugin.settings?.feed_URL) {
        plugin.log.warn('[FEED Plugin] feed URL is required!')
        clearInterval(plugin.interval)
        return
      }
      try {
        plugin.log.debug(`[FEED Plugin] Fetching ${plugin.settings?.feed_URL}`)

        const response = await axios.post(`${plugin.apiBaseUrl}/ics-import/url`, {
          url: plugin.settings.feed_URL,
          includePastEvents: plugin.settings.include_past
        })

        const events = response.data.events || []

        for (const evt of events) {
          // Check if an event with the same title and start_datetime already exists
          // TODO: Ideally this should use the ICS UID, but database does not have it
          const exists = await plugin.db.models.event.findOne({
            where: {
              title: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('title')), Sequelize.Op.eq, evt.title.toLocaleLowerCase()),
              start_datetime: evt.start_datetime,
            }
          });

          if (exists) {
            plugin.log.debug(`[FEED Plugin] Event ${evt.title} already exists, do not add it`);
            continue;
          }

          plugin.log.debug(`[FEED Plugin] Adding event: ${evt.title} `)

          const loc = evt.location?.trim()
          if (loc) {
            plugin.log.debug(`[FEED Plugin] Event address: ${loc}`)
          } else {
            plugin.log.debug(`[FEED Plugin] No location found in this event ${evt.title}`)
          }
          const pos = loc?.indexOf(',')
          const placeName = loc?.substring(0, pos === -1 ? undefined : pos).trim() || 'Unknown Place'
          const address = loc?.substring(pos === -1 ? 0 : pos + 1).trim() || placeName

          // Create a new event
          // TODO [image]: ics could not embed images (ok you can use ATTACH but it is not supported by the used library, see https://github.com/adamgibbons/ics/issues/194,
          // we could visit the original event's url and get the image from there via opengraph with some fallback
          try {
            // TODO [place]: how we should create a place? in ics the location field is just a string, should we query nominatim?

            let place = await plugin.db.models.place.findOne({
              where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), Sequelize.Op.eq, placeName.toLocaleLowerCase()),
            })
            if (place) {
              plugin.log.debug(`[FEED Plugin] Place ${place.name} already exists, do not add it`)
            } else {
              plugin.log.info(`[FEED Plugin] Create a new place: ${placeName}`)
              place = await plugin.db.models.place.create({ name: placeName, address: address });
            }
            const dbEvent = await plugin.db.models.event.create(evt)
            plugin.log.debug(`[FEED Plugin] Create event ${dbEvent.title} @ ${place.name}`)
            dbEvent.setPlace(place)
          } catch (e) {
            console.error(e, String(e))
          }
        }
      } catch (e) {
        plugin.log.error(`[FEED Plugin] Error fetching ics "${plugin.settings?.feed_URL}": ${String(e)}`)
      }
    } catch (e) {
      plugin.log.error(`[FEED Plugin] Uncaught error in _tick: ${String(e)}`)
    } finally {
      plugin.log.debug('[FEED Plugin] _tick finished, unlocking it')
      plugin._isTickRunning = false
    }
  }
}

module.exports = plugin
