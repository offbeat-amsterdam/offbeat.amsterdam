<template lang="pug">
  client-only
    vc-date-picker(
      ref='cal'
      v-model='selectedDate'
      title-position='left'
      :is-dark="is_dark"
      :columns="!$vuetify.breakpoint.smAndDown ? 2 : 1"
      @input='click'
      :from-page='page'
      @update:from-page='updatePage'
      :locale='$i18n.locale'
      :attributes='attributes'
      :first-day-of-week='settings.calendar_first_day_of_week ?? undefined'
      transition='fade'
      aria-label='Calendar'
      is-expanded
      is-inline)
    .calh.text-center(slot='placeholder')
      v-progress-circular.mt-5(indeterminate color='primary')

</template>
<script>
import { mapState, mapGetters } from 'vuex'
import { DateTime } from 'luxon'
import { mdiChevronDown, mdiClose } from '@mdi/js'

export default {
  name: 'Calendar',
  data ({ $time, $store }) {
    // reopen on the day/month selected before visiting an event (see pages/index.vue)
    const { day, month } = $store.state.homeView
    return {
      mdiChevronDown, mdiClose,
      selectedDate: day ? DateTime.fromISO(day).toJSDate() : null,
      page: month ? { ...month } : { month: $time.currentMonth(), year: $time.currentYear() },
      // The home list is paginated, so the dots come from their own
      // lightweight request covering the months on screen
      dotEvents: [],
      dotsKey: null
    }
  },
  computed: {
    ...mapState(['settings', 'filter']),
    ...mapGetters(['is_dark']),
    attributes () {
      return this.$time.attributesFromEvents(this.dotEvents)
    }
  },
  watch: {
    'filter.show_recurrent': 'loadDots',
    'filter.show_multidate': 'loadDots'
  },
  mounted () {
    this.loadDots()
  },
  methods: {
    updatePage (page) {
      if (page.month !== this.page.month || page.year !== this.page.year) {
        this.page.month = page.month
        this.page.year = page.year
        this.$root.$emit('monthchange', page)
      }
      this.loadDots()
    },
    async loadDots () {
      const first = DateTime.fromObject({ year: this.page.year, month: this.page.month }, { zone: this.settings.instance_timezone })
      const columns = this.$vuetify.breakpoint.smAndDown ? 1 : 2
      const params = {
        start: first.toUnixInteger(),
        end: first.plus({ months: columns - 1 }).endOf('month').toUnixInteger(),
        show_recurrent: this.filter.show_recurrent,
        show_multidate: this.filter.show_multidate,
        light: true
      }
      const key = JSON.stringify(params)
      if (key === this.dotsKey) return
      this.dotsKey = key
      try {
        const events = await this.$api.getEvents(params)
        // ignore answers for months already navigated away from
        if (this.dotsKey === key) this.dotEvents = events
      } catch (e) {
        console.error('[CALENDAR] loadDots', e)
        this.dotsKey = null
      }
    },
    click (day) {
      this.$root.$emit('dayclick', day)
    }
  }
}
</script>

<style>
.vc-container.vc-is-dark {
  --gray-900: #111;
  --gray-700: #333;
}

.vc-container {
  --gray-400: #999 !important;
  --rounded-lg: 4px !important;
}

.vc-opacity-0 {
  opacity: 0.3 !important;
}

.past-event {
  opacity: 0.3;
}

#calendarButton {
  margin-top: -6px;
  margin-left: -10px;
}
</style>
