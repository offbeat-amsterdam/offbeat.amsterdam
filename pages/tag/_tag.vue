<template>
  <v-container id='home' class='px-2 px-sm-6 pt-0' fluid>

    <h1 class='d-block text-h3 font-weight-black text-center text-uppercase mt-10 mx-auto w-100 text-underline'><u>{{tag}}</u></h1>

    <!-- Events -->
    <div class="mb-2 mt-14 pl-1 pl-sm-2" id="events">
      <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in events' :key='event.id' :min-height='hide_thumbs ? 105 : undefined' :options="{ threshold: .5, rootMargin: '500px' }" :class="{ 'theme--dark': is_dark }">
        <Event :event='event' :lazy='idx>9' />
      </v-lazy>
    </div>

    <!-- Next page loads when this comes into view, the button is a fallback -->
    <div ref='moreEvents' class='text-center my-4'>
      <v-btn v-if='hasMoreEvents' text :loading='loadingMoreEvents' @click='loadMoreEvents'>{{ $t('common.load_more') }}</v-btn>
    </div>

    <PastEvents :events='pastEvents' :has-more='hasMorePast' :url='`/tag/${encodeURIComponent(tag)}`' />

  </v-container>
</template>
<script>

import { mapState, mapGetters } from 'vuex'
import Event from '@/components/Event'
import PastEvents from '@/components/PastEvents'
import pagedEvents from '@/assets/pagedEvents'

export default {
  name: 'Tag',
  components: { Event, PastEvents },
  mixins: [pagedEvents],
  head ({ $route }) {
    const tag = $route.params.tag
    const title = `Events tagged #${tag} | ${this.settings.title}`
    return {
      title,
      htmlAttrs: {
        lang: this.settings.instance_locale
      },
      link: [
        { rel: 'alternate', type: 'application/rss+xml', title, href: this.settings.baseurl + `/feed/rss/tag/${tag}` },
        { rel: 'alternate', type: 'text/calendar', title, href: this.settings.baseurl + `/feed/ics/tag/${tag}` }
      ]
    }
  },
  computed: {
    ...mapState(['settings']),
    ...mapGetters(['hide_thumbs', 'is_dark']),
    eventsUrl () {
      return `/tag/${encodeURIComponent(this.tag)}`
    }
  },
  async asyncData ({ $axios, params, error }) {
    try {
      const tag = params.tag
      const { pastEvents, hasMorePast, events, hasMoreEvents, eventsStart } =
        await $axios.$get(`/tag/${encodeURIComponent(tag)}`, { params: { page: 0, past_page: 0 } })
      return { pastEvents, hasMorePast, events, hasMoreEvents, eventsStart, tag }
    } catch (e) {
      error(e)
    }
  }

}
</script>
