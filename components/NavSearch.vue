<template lang="pug">
#navsearch.mt-2.mt-sm-4(v-if='showCollectionsBar || showSearchBar || showCalendar')
  .navsearch__items.mx-2
    v-text-field(v-if='showSearchBar' v-model='query' outlined dense hide-details clearable
      :prepend-inner-icon='mdiMagnify' :clear-icon='mdiClose'
      :placeholder='$t("common.search_placeholder")' :aria-label='$t("common.search")'
      @input='searchSoon' @keydown.enter='search' @click:clear='clear')

    CollectionsBar(v-if='showCollectionsBar && collections.length' :collections='collections')

    CollapsibleSection(v-if='showCalendar' name='calendar'
      :show-label='$t("common.show_calendar")' :hide-label='$t("common.hide_calendar")')
      Calendar
</template>
<script>
import { mapState, mapActions } from 'vuex'
import debounce from 'lodash/debounce'
import Calendar from '@/components/Calendar'
import CollectionsBar from '@/components/CollectionsBar'
import CollapsibleSection from '@/components/CollapsibleSection'
import { mdiClose, mdiMagnify } from '@mdi/js'

// search while typing, from this many characters
const MIN_QUERY_LENGTH = 2

export default {
  data: ({ $store }) => ({
    mdiClose, mdiMagnify,
    // the active search, e.g. when coming back from an event
    query: $store.state.filter.query || ''
  }),
  components: { Calendar, CollectionsBar, CollapsibleSection },
  computed: {
    ...mapState(['collections', 'settings', 'filter']),
    showSearchBar () {
      return ['index'].includes(this.$route.name)
    },
    showCalendar () {
      return (!this.settings.hide_calendar &&
        ['index'].includes(this.$route.name))
    },
    showCollectionsBar () {
      return ['index', 'collection-collection'].includes(this.$route.name)
    }
  },
  created () {
    this.searchSoon = debounce(this.search, 400)
  },
  methods: {
    ...mapActions(['setFilter']),
    search () {
      this.searchSoon.cancel()
      const query = (this.query || '').trim()
      if (query && query.length < MIN_QUERY_LENGTH) return
      if (query !== (this.filter.query || '')) {
        this.setFilter(['query', query || null])
      }
    },
    clear () {
      this.query = ''
      this.search()
    }
  }
}
</script>
<style>
#navsearch {
  margin: 0 auto;
  max-width: 700px;
}

/* one spacing between search, venues and calendar */
.navsearch__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
