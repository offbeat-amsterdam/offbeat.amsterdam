import { DateTime } from 'luxon'

export function formatISO(timestamp, timezone) {
  return DateTime.fromSeconds(timestamp, { zone: timezone }).toISO()
}

export function buildEventJsonLd(event, settings, $helper) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: formatISO(event.start_datetime, settings.instance_timezone),
    eventStatus: "https://schema.org/EventScheduled",
    description: event.plain_description || "",
    mainEntityOfPage: `${settings.baseurl}/event/${event.slug || event.id}`,
  }

  if (event.online_locations?.[0]) {
    schema.url = event.online_locations[0]
  }

  if (event.end_datetime) {
    schema.endDate = formatISO(event.end_datetime, settings.instance_timezone)
  }

  const isOnline = event.place?.name?.toLowerCase() === 'online'
  schema.eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode"
  schema.location = isOnline
    ? { "@type": "Place", name: "Multiple Locations" }
    : {
        "@type": "Place",
        name: event.place.name,
        address: { "@type": "PostalAddress", streetAddress: event.place.address }
      }

  if (event.tags?.length) {
    schema.keywords = event.tags.join(', ')
  }

  const image = $helper?.mediaURL?.(event)
  if (image) {
    schema.image = image
  }

  if (event.online_locations?.length) {
    schema.offers = {
      "@type": "Offer",
      url: event.online_locations[1] || event.online_locations[0],
      availability: "https://schema.org/InStock"
    }
  }

  return schema
}

/**
 * An event counts as long running when the author explicitly flagged it as a
 * multi-day event, or when it simply spans two days or more.
 *
 * The duration fallback is what actually does the work: `multidate` is set by
 * hand in the date input and virtually no imported event carries it. 48h is
 * picked so the all-nighters that cross midnight (12-15h, a big chunk of the
 * agenda) stay out, while festivals and exhibitions fall in.
 */
export const LONG_EVENT_SECONDS = 48 * 60 * 60

export function eventDuration (event) {
  if (!event || !event.start_datetime || !event.end_datetime) { return 0 }
  return event.end_datetime - event.start_datetime
}

export function isLongRunning (event) {
  return event?.multidate === true || eventDuration(event) >= LONG_EVENT_SECONDS
}

/**
 * A long running event that has already opened. These are the ones that pin
 * themselves to the top of a list sorted by start_datetime, so they get pulled
 * out of the chronological feed and shown apart.
 */
export function isOnNow (event, now) {
  return isLongRunning(event) &&
    event.start_datetime <= now &&
    event.end_datetime > now
}

/**
 * Split a chronologically sorted list into the events running right now and
 * the rest, which keeps its original order. A long running event that has not
 * opened yet stays in the feed, at its opening date, where it belongs.
 */
export function splitOnNow (events, now) {
  const onNow = []
  const upcoming = []
  for (const event of events) {
    ;(isOnNow(event, now) ? onNow : upcoming).push(event)
  }
  // closing soonest first: that is the only urgent thing about an exhibition
  onNow.sort((a, b) => a.end_datetime - b.end_datetime)
  return { onNow, upcoming }
}
