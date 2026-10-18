<template>
<v-container class='px-2 px-sm-6 pt-0' id='home'>

    <!-- Announcements -->
    <section id='announcements' class='mt-2 mt-sm-4' v-if='announcements?.length'>
      <Announcement v-for='announcement in announcements' :key='`a_${announcement.id}`' :announcement='announcement' />
    </section>
  
    <SearchResults v-if='filter.query' :query='filter.query' @select='storeEventId' />

    <template v-else>
    <OngoingRail class='mt-sm-4 mt-2' v-if='!$fetchState.pending' :events='ongoingEvents' @select='storeEventId' />

    <!-- Events -->
    <section id='events' class='mt-sm-4 mt-2' v-if='!$fetchState.pending'>
      <v-lazy class='event v-card' :value='shouldLoadImmediately(idx)'
        v-for='(event, idx) in upcomingEvents' :key='event.id'
        :min-height='hide_thumbs ? 105 : undefined'
        :options="{ threshold: .5, rootMargin: '500px' }"
        :class="{ 'theme--dark': is_dark }"
        :data-event-id="event.id"
        @click.native="storeEventId(event)">
        <Event :event='event' :lazy='!shouldLoadImmediately(idx)' />
      </v-lazy>
    </section>
    <section class='text-center' v-else>
      <v-progress-circular class='mt-5 justify-center align-center mx-auto' color='primary' indeterminate model-value='20' />
    </section>
    </template>

    <!-- Next page loads when this comes into view, the button is a fallback -->
    <div ref='more' class='text-center my-4'>
      <v-btn v-if='eventsPaging.hasMore && !$fetchState.pending && !filter.query' text :loading='loadingMore' @click='loadMore'>
        {{ $t('common.load_more') }}
      </v-btn>
    </div>

</v-container>
</template>

<script>
import { mapState, mapActions, mapGetters  } from 'vuex'
import { DateTime } from 'luxon'
import Event from '@/components/Event'
import OngoingRail from '@/components/OngoingRail'
import SearchResults from '@/components/SearchResults'
import Announcement from '@/components/Announcement'
import ThemeView from '@/components/ThemeView'
import { mdiMagnify, mdiCloseCircle } from '@mdi/js'
import ongoingSplit from '@/assets/ongoingSplit'
import { HOME_PAGE_SIZE, homeListStart } from '@/utils/eventUtils'

export default {
  name: 'Index',
  components: { Event, Announcement, ThemeView, OngoingRail, SearchResults },
  mixins: [ongoingSplit],
  middleware: 'setup',
  fetch () {
    if (process.server) return
    // searching: SearchResults loads its own results
    if (this.filter.query) return
    // Back from an event page: keep the pages already loaded, so the scroll
    // position can be restored to an event further down the list
    if (this.canRestoreLoadedEvents()) return
    return this.getEvents(this.listQuery)
  },
  data (vm) {
    // Day and month selected in the calendar survive a visit to an event
    // page, so going back shows the same list (see beforeRouteLeave)
    const { day, month } = vm.$store.state.homeView
    const view = month ? vm.monthRange(month) : { isCurrentMonth: true, start: homeListStart(vm.$time.nowUnix()), end: null }
    return {
      mdiMagnify, mdiCloseCircle,
      isCurrentMonth: view.isCurrentMonth,
      now: vm.$time.nowUnix(),
      start: view.start,
      end: view.end,
      loadingMore: false,
      moreObserver: null,
      // cards up to this index render right away (see shouldLoadImmediately)
      eagerUntil: 8,
      tmpEvents: [],
      selectedDay: day ? DateTime.fromISO(day, { zone: vm.$store.state.settings.instance_timezone }) : null,
      storeUnsubscribe: null,
      lastViewedEventId: null,
      scrollAttempts: 0,
    }
  },
  head () {
    // FIXME: Temporary solution to include part of the description into index title
    const desc = this.settings?.description || ''
    const shortDesc = desc.includes('. ') ? desc.split('. ')[0] : desc

    return {
      title: this.settings.title + ' | ' + shortDesc,
      htmlAttrs: {
        lang: this.settings.instance_locale,
      },
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: this.settings?.description },
        { hid: 'og-description', name: 'og:description', content: this.settings?.description },
        { hid: 'og-title', property: 'og:title', content: this.settings.title },
        { hid: 'og-url', property: 'og:url', content: this.settings.baseurl },
        { property: 'og:image', content: this.settings.baseurl + '/logo.png' },
      ],
      link: [
        { rel: 'apple-touch-icon', href: this.settings.baseurl + '/logo.png' },
        { rel: 'alternate', type: 'application/rss+xml', title: this.settings.title, href: this.settings.baseurl + '/feed/rss' },
        { rel: 'alternate', type: 'text/calendar', title: this.settings.title, href: this.settings.baseurl + '/feed/ics' },
        { rel: 'me', href: `${this.settings.baseurl}/federation/u/${this.settings.instance_name}`},
      ]
    }
  },
  computed: {
    ...mapState(['settings', 'announcements', 'events', 'eventsPaging', 'filter', 'homeView']),
    ...mapGetters(['hide_thumbs', 'is_dark']),
    // only part of the list is loaded: a selected day is fetched on its own
    listQuery () {
      if (this.selectedDay) {
        return {
          start: this.selectedDay.startOf('day').toUnixInteger(),
          end: this.selectedDay.endOf('day').toUnixInteger()
        }
      }
      return { start: this.start, end: this.end, max: HOME_PAGE_SIZE }
    },
    visibleEvents () {
      const now = this.$time.nowUnix()
      if (this.selectedDay) {
        const min = this.selectedDay.startOf('day').toUnixInteger()
        const max = this.selectedDay.endOf('day').toUnixInteger()
        return this.events.filter(e => (e.start_datetime <= max && (e.end_datetime || (e.start_datetime + 1)) > min) && (this.filter.show_recurrent || !e.parentId))
      } else if (this.isCurrentMonth && !this.filter.query) {
          return this.events.filter(e => {
            const max_datetime = Math.max(e.start_datetime, e.end_datetime)
            return (e.end_datetime ? max_datetime >= now : e.start_datetime + 3 * 60 * 60 >= now) && (this.filter.show_recurrent || !e.parentId)
          })
      } else {
        return this.events.filter(e => this.filter.show_recurrent || !e.parentId)
      }
    },

    eventsToSplit () {
      return this.visibleEvents
    },

    splitOngoing () {
      return !this.selectedDay
    }
  },
  created () {
    this.$root.$on('dayclick', this.dayChange)
    this.$root.$on('monthchange', this.monthChange)
    if (process.client) {
      this.storeUnsubscribe = this.$store.subscribeAction( { after: (action, state) => {
        if (action.type === 'setFilter') { this.$fetch() }
      }})
    }
  },
  beforeRouteLeave (to, _from, next) {
    if (to.name !== 'event-slug') {
      this.$store.commit('setHomeView', { day: null, month: null })
    }
    next()
  },
  mounted () {
    this.initScrollRestoration()
    this.moreObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) this.loadMore()
    }, { rootMargin: '800px' })
    this.moreObserver.observe(this.$refs.more)
  },
  destroyed () {
    if (this.moreObserver) {
      this.moreObserver.disconnect()
    }
    this.$root.$off('dayclick')
    this.$root.$off('monthchange')
    if (typeof this.storeUnsubscribe === 'function') {
      this.storeUnsubscribe()
    }
  },
  methods: {
    ...mapActions(['getEvents', 'getMoreEvents']),

    async loadMore () {
      if (this.loadingMore || this.$fetchState.pending || this.filter.query || !this.eventsPaging.hasMore) return
      this.loadingMore = true
      try {
        await this.getMoreEvents()
      } finally {
        this.loadingMore = false
      }
      // The observer only fires on changes: keep going while the end of the
      // list is still in view, e.g. when a page held only ongoing events
      this.$nextTick(() => {
        const more = this.$refs.more
        if (more && more.getBoundingClientRect().top < window.innerHeight + 800) {
          this.loadMore()
        }
      })
    },

    canRestoreLoadedEvents () {
      const lastEventId = Number(sessionStorage.getItem('last_event_id'))
      const params = this.eventsPaging.params
      return !!lastEventId && !!params && params.start === this.listQuery.start && params.end === (this.listQuery.end ?? null) &&
        params.show_recurrent === this.filter.show_recurrent && params.show_multidate === this.filter.show_multidate &&
        this.events.some(e => e.id === lastEventId)
    },

    // Store event ID for scroll restoration
    storeEventId(event) {
      this.lastViewedEventId = event.id
      if (process.client) {
        sessionStorage.setItem('last_event_id', event.id.toString())
      }
    },

    initScrollRestoration() {
      // Disable browser scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'
      }
      // Other pages scroll to top in app/router.scrollBehavior.js. This runs on
      // each mount instead of a router hook, which would outlive the component
      this.restoreScrollToLastEvent()
    },

    // Only ever grows: v-lazy drops its content when its value turns false,
    // which would collapse the cards above a restored event
    shouldLoadImmediately(idx) {
      return idx <= this.eagerUntil
    },

    restoreScrollToLastEvent() {
      if (!process.client) return

      const lastEventId = sessionStorage.getItem('last_event_id')
      if (!lastEventId) {
        window.scrollTo(0, 0)
        return
      }

      this.lastViewedEventId = parseInt(lastEventId)
      this.scrollAttempts = 0

      this.$nextTick(() => {
        this.scrollToEvent()
      })
    },

    scrollToEvent() {
      if (this.scrollAttempts > 20) {
        this.resetScrollRestorationState()
        return
      }

      // Render every card up to the event first, so the layout above it is final
      const targetEventIndex = this.upcomingEvents.findIndex(e => e.id === this.lastViewedEventId)
      if (targetEventIndex > this.eagerUntil) {
        this.eagerUntil = targetEventIndex
      }

      this.$nextTick(() => {
        const eventElement = document.querySelector(`[data-event-id="${this.lastViewedEventId}"]`)

        if (eventElement) {
          eventElement.scrollIntoView({
            behavior: 'instant',
            block: 'center'
          })

          this.resetScrollRestorationState()
        } else {
          // Event not rendered yet, try again
          this.scrollAttempts++
          setTimeout(() => {
            this.scrollToEvent()
          }, 300)
        }
      })
    },

    resetScrollRestorationState() {
      this.lastViewedEventId = null
      this.scrollAttempts = 0
      if (process.client) {
        sessionStorage.removeItem('last_event_id')
      }
    },

    // Called from data(): use $store, computed properties don't exist yet
    monthRange ({ year, month }) {
      const zone = this.$store.state.settings.instance_timezone
      const now = DateTime.local({ zone })
      // check if current month is selected
      if (month === now.month && year === now.year) {
        return { isCurrentMonth: true, start: homeListStart(now.toUnixInteger()), end: null }
      }
      const first = DateTime.local(year, month, { zone })
      return {
        isCurrentMonth: false,
        start: first.toUnixInteger(),
        end: first.plus({ month: !this.$vuetify.breakpoint.smAndDown ? 1 : 0 }).endOf('month').toUnixInteger() // .endOf('week').unix()
      }
    },

    async monthChange ({ year, month }) {
      if (this.filter.query) return
      this.$nuxt.$loading.start()

      this.resetScrollRestorationState()

      // unselect current selected day
      this.selectedDay = null
      const { isCurrentMonth, start, end } = this.monthRange({ year, month })
      this.$store.commit('setHomeView', { day: null, month: isCurrentMonth ? null : { year, month } })
      this.start = start
      this.end = end
      await this.$fetch()
      this.$nuxt.$loading.finish()
      this.$nextTick( () => this.isCurrentMonth = isCurrentMonth)
    },

    async dayChange (day) {
      this.resetScrollRestorationState()

      // only part of the list is loaded: fetch the selected day on its own
      if (day) {
        const date = DateTime.fromJSDate(day)
        this.selectedDay = DateTime.local({ zone: this.settings.instance_timezone }).set({ year: date.year, month: date.month, day: date.day})
      } else {
        this.selectedDay = null
      }
      this.$store.commit('setHomeView', { ...this.homeView, day: this.selectedDay && this.selectedDay.toISODate() })
      this.$nuxt.$loading.start()
      await this.$fetch()
      this.$nuxt.$loading.finish()
    }
  }
}
</script>
