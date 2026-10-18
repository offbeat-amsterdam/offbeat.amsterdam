/**
 * Upcoming events of a tag or place page, loaded a page at a time while
 * scrolling.
 *
 * A page supplies `eventsUrl` and, from asyncData, the first page: `events`,
 * `hasMoreEvents` and `eventsStart`. Its template puts `ref='moreEvents'` on an
 * element right after the list.
 */
export default {
  data () {
    return {
      eventsPage: 0,
      loadingMoreEvents: false,
      moreEventsObserver: null
    }
  },
  watch: {
    // same page component, other tag or place: asyncData brought a new first page
    eventsUrl () {
      this.eventsPage = 0
    }
  },
  mounted () {
    this.moreEventsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) this.loadMoreEvents()
    }, { rootMargin: '800px' })
    this.moreEventsObserver.observe(this.$refs.moreEvents)
  },
  destroyed () {
    if (this.moreEventsObserver) {
      this.moreEventsObserver.disconnect()
    }
  },
  methods: {
    async loadMoreEvents () {
      if (this.loadingMoreEvents || !this.hasMoreEvents) return
      this.loadingMoreEvents = true
      try {
        const { events, hasMoreEvents } = await this.$axios.$get(this.eventsUrl, {
          params: { page: this.eventsPage + 1, start: this.eventsStart }
        })
        const loaded = new Set(this.events.map(e => e.id))
        this.events = [...this.events, ...events.filter(e => !loaded.has(e.id))]
        this.hasMoreEvents = hasMoreEvents
        this.eventsPage++
      } catch (e) {
        console.error('[pagedEvents] loadMoreEvents', e)
        return
      } finally {
        this.loadingMoreEvents = false
      }
      // The observer only fires on changes: keep going while the end of the
      // list is still in view
      this.$nextTick(() => {
        const more = this.$refs.moreEvents
        if (more && more.getBoundingClientRect().top < window.innerHeight + 800) {
          this.loadMoreEvents()
        }
      })
    }
  }
}
