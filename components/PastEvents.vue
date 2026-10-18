<template>
<section v-if='endedEvents.length || hasMorePast'>
  <h2 class='mt-14 mb-3'>{{ $t('common.past_events') }}</h2>
  <div id='events'>
    <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in endedEvents' :key='event.id' :min-height='hide_thumbs ? 105 : undefined' :options="{ threshold: .5, rootMargin: '500px' }" :class="{ 'theme--dark': is_dark }">
      <Event :event='event' :lazy='idx > 9' />
    </v-lazy>
  </div>
  <div v-if='hasMorePast' class='text-center my-4'>
    <v-btn text :loading='loading' @click='loadMore'>{{ $t('common.load_more') }}</v-btn>
  </div>
</section>
</template>
<script>
import { mapGetters } from 'vuex'
import Event from '@/components/Event'

/**
 * Past events of a tag or place page, most recent first. The first page comes
 * with the page itself, the next ones from `url` with `past_page`.
 */
export default {
  name: 'PastEvents',
  components: { Event },
  props: {
    events: { type: Array, default: () => [] },
    hasMore: { type: Boolean, default: false },
    url: { type: String, required: true }
  },
  data () {
    return {
      pastEvents: this.events,
      hasMorePast: this.hasMore,
      page: 0,
      loading: false
    }
  },
  computed: {
    ...mapGetters(['hide_thumbs', 'is_dark']),
    /**
     * The API calls an event past as soon as it has *started*, so anything
     * running right now comes back in both lists. Only what has actually
     * finished belongs under "past events".
     */
    endedEvents () {
      const now = this.$time.nowUnix()
      return this.pastEvents.filter(e => (e.end_datetime || e.start_datetime) <= now)
    }
  },
  watch: {
    // same page component, other tag or place
    events (events) {
      this.pastEvents = events
      this.hasMorePast = this.hasMore
      this.page = 0
    }
  },
  methods: {
    async loadMore () {
      if (this.loading) return
      this.loading = true
      try {
        const { pastEvents, hasMorePast } = await this.$axios.$get(this.url, { params: { past_page: this.page + 1 } })
        // events turning past since the first page shift the pages: skip repeats
        const loaded = new Set(this.pastEvents.map(e => e.id))
        this.pastEvents = [...this.pastEvents, ...pastEvents.filter(e => !loaded.has(e.id))]
        this.hasMorePast = hasMorePast
        this.page++
      } catch (e) {
        console.error('[PastEvents] loadMore', e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
