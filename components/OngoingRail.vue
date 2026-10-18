<template>
<section class='ongoing' v-if='events.length'>

  <h2 class='ongoing__heading'>
    <!-- .heading-toggle: in the look of the day headers below (TODAY, ...) -->
    <button type='button' class='heading-toggle ongoing__toggle'
      :aria-expanded='String(!collapsed)' :aria-controls='railId'
      @click='toggle'>
      <span class='heading-toggle__mark' aria-hidden='true'>{{ collapsed ? '[+]' : '[-]' }}</span>
      <span>{{ $t('event.ongoing') }}</span>
    </button>
  </h2>

  <div :id='railId' class='ongoing__rail' :class="{ 'ongoing__rail--single': events.length === 1 }" v-show='!collapsed'>
    <EventCompact v-for='event in events' :key='event.id' :event='event'
      :data-event-id='event.id' @click.native="$emit('select', event)" />
  </div>

</section>
</template>
<script>
import EventCompact from '~/components/EventCompact'

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

/* the whole line is clickable */
.ongoing__toggle {
  width: 100%;
}

.ongoing__rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min(330px, 85vw);
  gap: 8px;
  /* same 12px as between the search, venues and calendar (NavSearch.vue) */
  margin-top: 12px;
  padding-bottom: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
}

/* below the desktop grid: a lone card takes the full width like the regular
   cards, there's nothing to scroll to */
@media only screen and (max-width: 959px) {
  .ongoing__rail--single {
    grid-auto-columns: 100%;
  }

  .ongoing__rail--single .event-compact {
    max-width: none;
  }
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
