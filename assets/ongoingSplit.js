import { splitOnNow } from '../utils/eventUtils'

/**
 * Splits a chronologically ordered list of events into the long running ones
 * that have already opened and everything else.
 *
 * A page supplies `eventsToSplit`. It may also override `splitOngoing` to turn
 * the split off.
 */
export default {
  computed: {
    splitOngoing () {
      return true
    },
    splitEvents () {
      if (!this.splitOngoing) {
        return { onNow: [], upcoming: this.eventsToSplit }
      }
      return splitOnNow(this.eventsToSplit, this.$time.nowUnix())
    },
    ongoingEvents () {
      return this.splitEvents.onNow
    },
    upcomingEvents () {
      return this.splitEvents.upcoming
    }
  }
}
