<template>
<section class='collapsible' :class='`collapsible--${state}`'>

  <h2 class='collapsible__heading'>
    <button type='button' class='section-toggle'
      :aria-expanded='ariaExpanded' :aria-controls='contentId'
      @click='toggle'>
      <!-- both labels and icons are rendered: CSS shows the ones matching the state -->
      <span>
        <span class='collapsible__when-collapsed'>{{ showLabel }}</span>
        <span class='collapsible__when-expanded'>{{ hideLabel }}</span>
        <template v-if='count !== null'> ({{ count }})</template>
      </span>
      <v-icon small class='collapsible__when-collapsed' v-text='mdiChevronDown' />
      <v-icon small class='collapsible__when-expanded' v-text='mdiChevronUp' />
    </button>
  </h2>

  <div :id='contentId' class='collapsible__content'>
    <slot />
  </div>

</section>
</template>
<script>
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'

const MOBILE = '(max-width: 599px)'

/**
 * A section with a show/hide toggle (the venues list and the calendar of the
 * home page). Until the viewer folds or unfolds it, it is collapsed on phones
 * and open on larger screens. The server doesn't know the screen size, so that
 * default comes from CSS (`collapsible--auto`) instead of a value that would
 * flip after hydration. The viewer's choice is kept in the `<name>_collapsed`
 * cookie.
 */
export default {
  name: 'CollapsibleSection',
  props: {
    name: { type: String, required: true },
    showLabel: { type: String, required: true },
    hideLabel: { type: String, required: true },
    count: { type: Number, default: null }
  },
  data () {
    const stored = this.$cookies?.get(`${this.name}_collapsed`)
    return {
      mdiChevronDown,
      mdiChevronUp,
      // true / false once chosen, null for the screen size default
      collapsed: typeof stored === 'boolean' ? stored : null,
      // what the CSS default currently shows, known only in the browser
      autoCollapsed: null
    }
  },
  computed: {
    contentId () {
      return `${this.name}-content`
    },
    state () {
      if (this.collapsed === null) return 'auto'
      return this.collapsed ? 'collapsed' : 'expanded'
    },
    ariaExpanded () {
      const collapsed = this.collapsed ?? this.autoCollapsed
      return collapsed === null ? undefined : String(!collapsed)
    }
  },
  mounted () {
    this.autoCollapsed = window.matchMedia(MOBILE).matches
  },
  methods: {
    toggle () {
      this.collapsed = !(this.collapsed ?? window.matchMedia(MOBILE).matches)
      this.$cookies?.set(`${this.name}_collapsed`, this.collapsed, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
  }
}
</script>
<style>
.collapsible__heading {
  margin: 0;
  /* the h2's own line height would add space around the toggle */
  line-height: 0;
}

/* 12px below the toggle, like the Ongoing rail */
.collapsible__content {
  margin-top: 12px;
}

.collapsible--collapsed .collapsible__content,
.collapsible--collapsed .collapsible__when-expanded,
.collapsible--expanded .collapsible__when-collapsed,
.collapsible--auto .collapsible__when-collapsed {
  display: none !important;
}

@media (max-width: 599px) {
  .collapsible--auto .collapsible__content,
  .collapsible--auto .collapsible__when-expanded {
    display: none !important;
  }

  .collapsible--auto .collapsible__when-collapsed {
    display: inline-flex !important;
  }
}
</style>
