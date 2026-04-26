const ical = require('ical.js')
const log = require('../log')
const { status } = require('../config')

function parseIcsData (icsText, includePastEvents = true) {
  const ret = ical.parse(icsText)
  const component = new ical.Component(ret)
  const events = component.getAllSubcomponents('vevent')

  // TODO: Handle received not ics Text

  log.debug(`[ICS-PARSER] Found ${events.length} event(s)`)

  const now = Math.floor(Date.now() / 1000)

  return events
    .map(eventData => {
      const event = new ical.Event(eventData)
      const start_datetime = event.startDate.toUnixTime()
      const end_datetime = event.endDate.toUnixTime()

      // Time check:
      // Skip event only if it has fully ended in the past.
      // That means: both start_datetime AND end_datetime must be less than 'now'.
      // -> Events that are currently ongoing (start < now && end > now) should still be imported.
      if (!includePastEvents && start_datetime < now && end_datetime < now) {
        return null
      }

      // Check if optional organizer is present (RFC 5545:
      // "This property is OPTIONAL and MAY appear in an iCalendar object
      //  that specifies a group-scheduled calendar entity.")
      const organizerProp = event.component.getFirstProperty('organizer')
      const organizer = organizerProp
        ? {
            name: organizerProp.getParameter('cn') || '',
            email: (organizerProp.getFirstValue() || '').replace(/^mailto:/i, '')
          }
        : null

      return {
        title: event.summary || '',
        description: event.description || '',
        organizer, // contains { name, email } or null
        status: event.status || status,
        uid: event.uid || '',
        location: event.location || '',
        start_datetime,
        end_datetime,
        modified: event.lastModified?.toUnixTime() || '',
        is_visible: true
      }
    }).filter(Boolean)
}

module.exports = { parseIcsData }
