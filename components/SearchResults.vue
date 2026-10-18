<template>
<div>
  <div v-if='loading' class='text-center'>
    <v-progress-circular class='mt-5' color='primary' indeterminate />
  </div>
  <template v-else>
    <p v-if='!events.length && !pastEvents.length' class='text-center mt-8'>{{ $t('common.no_results') }}</p>
    <section id='events' class='mt-3'>
      <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in events' :key='event.id'
        :min-height='hide_thumbs ? 105 : undefined'
        :options="{ threshold: .5, rootMargin: '500px' }"
        :class="{ 'theme--dark': is_dark }"
        :data-event-id='event.id'
        @click.native="$emit('select', event)">
        <Event :event='event' :lazy='idx > 9' />
      </v-lazy>
    </section>
  </template>

  <!-- Next page loads when this comes into view, the button is a fallback -->
  <div ref='moreEvents' class='text-center my-4'>
    <v-btn v-if='hasMoreEvents && !loading' text :loading='loadingMoreEvents' @click='loadMoreEvents'>{{ $t('common.load_more') }}</v-btn>
  </div>

  <PastEvents v-if='!loading' :events='pastEvents' :has-more='hasMorePast' :url='eventsUrl' />
</div>
</template>
<script>
import { mapGetters } from 'vuex'
import Event from '@/components/Event'
import PastEvents from '@/components/PastEvents'
import pagedEvents from '@/assets/pagedEvents'

/**
 * Home page search results: upcoming matches while scrolling, then past ones
 * with a `Load more` button (see /api/events/search)
 */
export default {
  name: 'SearchResults',
  components: { Event, PastEvents },
  mixins: [pagedEvents],
  props: {
    query: { type: String, required: true }
  },
  data () {
    return {
      loading: true,
      events: [],
      hasMoreEvents: false,
      eventsStart: null,
      pastEvents: [],
      hasMorePast: false
    }
  },
  computed: {
    ...mapGetters(['hide_thumbs', 'is_dark']),
    eventsUrl () {
      return `/events/search?query=${encodeURIComponent(this.query)}`
    }
  },
  watch: {
    query: 'search'
  },
  created () {
    if (process.client) this.search()
  },
  methods: {
    async search () {
      this.loading = true
      try {
        const results = await this.$axios.$get(this.eventsUrl, { params: { page: 0, past_page: 0 } })
        Object.assign(this, results)
      } catch (e) {
        console.error('[SearchResults] search', e)
        Object.assign(this, { events: [], hasMoreEvents: false, pastEvents: [], hasMorePast: false })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
