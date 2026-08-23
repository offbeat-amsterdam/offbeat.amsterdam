<template>
  <v-container id='home' class='px-2 px-sm-6 pt-0' fluid>

    <h1 class='d-block text-h3 font-weight-black text-center text-uppercase mt-10 mb-16 mx-auto w-100 text-underline'><u>{{collection}}</u></h1>
    
    <OngoingRail class='mb-6' :events='ongoingEvents' name='collection' />

    <!-- Events -->
    <div class="mb-2 mt-1 pl-1 pl-sm-2" id="events">
      <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in upcomingEvents' :key='event.id' :min-height='hide_thumbs ? 105 : undefined' :options="{ threshold: .5, rootMargin: '500px' }" :class="{ 'theme--dark': is_dark }">
        <Event :event='event' :lazy='idx>9' />
      </v-lazy>
    </div>
  </v-container>
</template>
<script>

import { mapState, mapGetters } from 'vuex'
import Event from '@/components/Event'
import OngoingRail from '@/components/OngoingRail'
import ongoingSplit from '@/assets/ongoingSplit'

export default {
  name: 'Collection',
  components: { Event, OngoingRail },
  mixins: [ongoingSplit],
  head () {
    const title = `${this.collection} events | ${this.settings.title}`
    return {
      title,
      htmlAttrs: {
        lang: this.settings.instance_locale
      },
      link: [
        { rel: 'alternate', type: 'application/rss+xml', title, href: this.settings.baseurl + `/feed/rss/collection/${this.collection}` },
        { rel: 'alternate', type: 'text/calendar', title, href: this.settings.baseurl + `/feed/ics/collection/${this.collection}` }
      ]
    }
  },
  computed: {
    ...mapState(['settings']),
    ...mapGetters(['hide_thumbs', 'is_dark']),
    eventsToSplit () {
      return this.events
    }
  },
  async asyncData ({ $axios, params, error }) {
    try {
      const collection = params.collection
      const events = await $axios.$get(`/collections/${encodeURIComponent(collection)}`)
      return { events, collection }
    } catch (e) {
      error({
        statusCode: e?.response?.status ?? 500,
        message: e?.response?.data?.message ?? e?.response?.data ?? e?.message ?? 'Request failed'
      })
    }
  }

}
</script>
