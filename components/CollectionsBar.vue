<template>
<section class='collections mt-2' :class='`collections--${state}`'>

  <h2 class='collections__heading'>
    <button type='button' class='section-toggle'
      :aria-expanded='ariaExpanded' aria-controls='collections-list'
      @click='toggle'>
      <!-- both labels and icons are rendered: CSS shows the ones matching the state -->
      <span class='collections__title'>
        <span class='collections__when-collapsed'>{{ $t('common.show_venues') }}</span>
        <span class='collections__when-expanded'>{{ $t('common.hide_venues') }}</span>
        ({{ collections.length }})
      </span>
      <v-icon small class='collections__when-collapsed' v-text='mdiChevronDown' />
      <v-icon small class='collections__when-expanded' v-text='mdiChevronUp' />
    </button>
  </h2>

  <div id='collections-list' class='collections__list'>
    <v-btn class='mr-2 mt-2' small outlined v-for='collection in collections'
      color='primary' :key='collection.id'
      :to='`/collection/${encodeURIComponent(collection.name)}`'>{{ collection.name }}</v-btn>
  </div>

</section>
</template>
<script>
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'

const MOBILE = '(max-width: 599px)'
const COOKIE = 'collections_collapsed'

/**
 * The collections (venues) bar of the home page. Until the viewer folds or
 * unfolds it, it is collapsed on phones and open on larger screens. The
 * server doesn't know the screen size, so that default comes from CSS
 * (`collections--auto`) instead of a value that would flip after hydration.
 */
export default {
  name: 'CollectionsBar',
  props: {
    collections: { type: Array, default: () => [] }
  },
  data () {
    const stored = this.$cookies?.get(COOKIE)
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
      this.$cookies?.set(COOKIE, this.collapsed, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
  }
}
</script>
<style>
.collections__heading {
  margin: 8px 0 0;
}

.collections--collapsed .collections__list,
.collections--collapsed .collections__when-expanded,
.collections--expanded .collections__when-collapsed,
.collections--auto .collections__when-collapsed {
  display: none !important;
}

@media (max-width: 599px) {
  .collections--auto .collections__list,
  .collections--auto .collections__when-expanded {
    display: none !important;
  }

  .collections--auto .collections__when-collapsed {
    display: inline-flex !important;
  }
}
</style>
