function formatDatetime(timestamp, type = 'long', addTimezone = false ) {
  const options =
    type === 'long'
      ? {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(addTimezone && { timeZoneName: 'short' })
      }
      : { hour: '2-digit', minute: '2-digit' }
  return new Date(timestamp * 1000).toLocaleString(undefined, options)
}


export function when(event) {
  // federated events really can be in another timezone; a multi venue
  // event (stored as the 'online' place) is local, so no suffix for it
  const addTimezone = !!event.ap_id
  if (event.multidate) {
    return formatDatetime(event.start_datetime, 'long', addTimezone) + ' - ' +
      formatDatetime(event.end_datetime, 'long', addTimezone)
  }
  return (
    formatDatetime(event.start_datetime, 'long', addTimezone)
  )
}
