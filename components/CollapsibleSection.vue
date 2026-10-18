<template>
<section class='collapsible' :class='`collapsible--${state}`'>

  <h2 class='collapsible__heading'>
    <button type='button' class='heading-toggle collapsible__toggle'
      :aria-expanded='ariaExpanded' :aria-controls='contentId'
      @click='toggle'>
      <!-- both marks are rendered: CSS shows the one matching the state -->
      <span class='heading-toggle__mark collapsible__when-collapsed' aria-hidden='true'>[+]</span>
      <span class='heading-toggle__mark collapsible__when-expanded' aria-hidden='true'>[-]</span>
      <span>{{ label }}</span>
    </button>
  </h2>

  <div :id='contentId' class='collapsible__content'>
    <slot />
  </div>

</section>
</template>
<script>
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
    label: { type: String, required: true }
  },
  data () {
    const stored = this.$cookies?.get(`${this.name}_collapsed`)
    return {
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
