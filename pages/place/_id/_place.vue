<template>
  <v-container id='home' class='px-2 px-sm-6 pt-0'>
    <h1 class='d-block text-h4 font-weight-black text-center text-uppercase mt-10 mx-auto w-100 text-underline'>
      <u>{{ place.name === 'online' ? $t('common.multiple_locations') : place.name }}</u>
    </h1>
    <span v-if='place.name!=="online"' class="d-block text-subtitle text-center w-100">{{ place.address }}</span>

    <!-- Map -->
    <div v-if='settings.allow_geolocation && place.latitude && place.longitude' >
      <div class="mt-4 mx-n2 md:mx-0">
        <Map :place='place' :LMapStyles="{'border-radius':0, height:'16rem'}" />
      </div>
      <div class="mt-4">
        <HowToArriveNav :place='place' class="justify-center" />
      </div>
    </div>
    
    <OngoingRail class='mt-14' :events='ongoingEvents' name='place' />

    <!-- Events -->
    <div id="events" :class="ongoingEvents.length ? 'mt-8' : 'mt-14'">
      <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in upcomingEvents' :key='event.id' :min-height='hide_thumbs ? 105 : undefined' :options="{ threshold: .5, rootMargin: '500px' }" :class="{ 'theme--dark': is_dark }">
        <Event :event='event' :lazy='idx > 9' />
      </v-lazy>
    </div>

    <!-- Next page loads when this comes into view, the button is a fallback -->
    <div ref='moreEvents' class='text-center my-4'>
      <v-btn v-if='hasMoreEvents' text :loading='loadingMoreEvents' @click='loadMoreEvents'>{{ $t('common.load_more') }}</v-btn>
    </div>

    <PastEvents :events='pastEvents' :has-more='hasMorePast' :url='`/place/${place.id}`' />

  </v-container>
</template>
<script>

import { mapState, mapGetters } from 'vuex'
import Event from '@/components/Event'
import ongoingSplit from '@/assets/ongoingSplit'
import HowToArriveNav from '@/components/HowToArriveNav.vue'
import OngoingRail from '@/components/OngoingRail'
import PastEvents from '@/components/PastEvents'
import pagedEvents from '@/assets/pagedEvents'

export default {
  name: 'Place',
  mixins: [ongoingSplit, pagedEvents],
  components: {
    Event,
    HowToArriveNav,
    OngoingRail,
    PastEvents,
    [process.client && 'Map']: () => import('@/components/Map.vue')
  },
  head() {
    const title = `${this.place.name} agenda | ${this.settings.title}`
    return {
      title,
      link: [
        { rel: 'alternate', type: 'application/rss+xml', title, href: this.settings.baseurl + `/feed/rss/place/${this.place.id}` },
        { rel: 'alternate', type: 'text/calendar', title, href: this.settings.baseurl + `/feed/ics/place/${this.place.id}` }
      ],
    }
  },
  computed: {
    ...mapState(['settings']),
    ...mapGetters(['hide_thumbs', 'is_dark']),
    eventsToSplit () {
      return this.events
    },
    eventsUrl () {
      return `/place/${this.place.id}`
    }
  },
  async asyncData({ $axios, params, error }) {
    try {
      const { events, hasMoreEvents, eventsStart, pastEvents, hasMorePast, place } =
        await $axios.$get(`/place/${params.id}`, { params: { page: 0, past_page: 0 } })
      return { events, hasMoreEvents, eventsStart, pastEvents, hasMorePast, place }
    } catch (e) {
      error({
        statusCode: e?.response?.status ?? 500,
        message: e?.response?.data?.message ?? e?.response?.data ?? e?.message ?? 'Request failed'
      })
    }
  }
}
</script>
