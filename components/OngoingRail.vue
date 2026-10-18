<template>
<section class='ongoing' v-if='events.length'>

  <h2 class='ongoing__heading'>
    <button type='button' class='section-toggle'
      :aria-expanded='String(!collapsed)' :aria-controls='railId'
      @click='toggle'>
      <span class='ongoing__title'>{{ $t(collapsed ? 'event.show_ongoing' : 'event.hide_ongoing') }} ({{ events.length }})</span>
      <v-icon small v-text='collapsed ? mdiChevronDown : mdiChevronUp' />
    </button>
  </h2>

  <div :id='railId' class='ongoing__rail' v-show='!collapsed'>
    <EventCompact v-for='event in events' :key='event.id' :event='event'
      :data-event-id='event.id' @click.native="$emit('select', event)" />
  </div>

</section>
</template>
<script>
import EventCompact from '~/components/EventCompact'
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'

export default {
  name: 'OngoingRail',
  components: { EventCompact },
  props: {
    events: { type: Array, default: () => [] },
    /**
     * Which rail this is. Scopes both the element id and the collapse cookie,
     * so folding the rail away on venue pages does not fold it on the home
     * page as well.
     */
    name: { type: String, default: 'home' }
  },
  data () {
    return {
      mdiChevronDown,
      mdiChevronUp,
      // read on the server too, so the rail does not flip after hydration
      collapsed: this.$cookies?.get(`ongoing_collapsed_${this.name}`) === true
    }
  },
  computed: {
    railId () {
      return `ongoing-rail-${this.name}`
    },
    cookieKey () {
      return `ongoing_collapsed_${this.name}`
    }
  },
  methods: {
    toggle () {
      this.collapsed = !this.collapsed
      this.$cookies?.set(this.cookieKey, this.collapsed, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
  }
}
</script>
<style>
.ongoing {
  margin: 0 auto;
  max-width: 1400px;
}

.ongoing__heading {
  margin: 0;
  /* the h2's own line height would add space around the toggle */
  line-height: 0;
}

.ongoing__rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min(330px, 85vw);
  gap: 8px;
  padding-bottom: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
}

@media only screen and (min-width: 960px) {
  .ongoing__rail {
    grid-auto-flow: row;
    grid-template-columns: repeat(auto-fit, 330px);
    grid-auto-rows: 1fr;
    overflow-x: visible;
    gap: 16px;
    justify-content: center;
  }
}
</style>
