<template>
<article class='event-compact'>

  <nuxt-link class='event-compact__thumblink' v-if='!hide_thumbs'
    :to='`/event/${event.slug || event.id}`' tabindex='-1' aria-hidden='true'>
    <MyPicture class='event-compact__thumb' :event='event' thumb lazy />
  </nuxt-link>

  <div class='event-compact__body'>

    <nuxt-link class='event-compact__title' :to='`/event/${event.slug || event.id}`'>{{ event.title }}</nuxt-link>

    <time class='event-compact__meta'
      :datetime='$time.unixFormat(event.end_datetime, "yyyy-MM-dd HH:mm")'>
      <v-icon small v-text='mdiCalendarRange' />
      {{ $time.until(event) }}
    </time>

    <div class='event-compact__meta p-location'>
      <template v-if='isOnline'>
        <v-icon small v-text='mdiMapMarkerMultiple' />
        <span>{{ $t('common.multiple_locations') }}</span>
      </template>
      <nuxt-link v-else class='place'
        :to='`/place/${event.place.id}/${encodeURIComponent(event.place.name)}`'>
        <v-icon small v-text='mdiMapMarker' />
        <span>{{ event.place.name }}</span>
      </nuxt-link>
    </div>

  </div>

</article>
</template>
<script>
import { mapGetters } from 'vuex'
import MyPicture from '~/components/MyPicture'
import { mdiMapMarker, mdiMapMarkerMultiple, mdiCalendarRange } from '@mdi/js'

export default {
  name: 'EventCompact',
  components: { MyPicture },
  data () {
    return { mdiMapMarker, mdiMapMarkerMultiple, mdiCalendarRange }
  },
  props: {
    event: { type: Object, default: () => ({}) }
  },
  computed: {
    ...mapGetters(['hide_thumbs']),
    isOnline () {
      return this.event.place?.name === 'online'
    }
  }
}
</script>
<style>
.event-compact {
  display: flex;
  align-items: stretch;
  min-width: 0;
  max-width: 330px;
  min-height: 84px;
  overflow: hidden;
}

.theme--dark .event-compact {
  border: 1px solid #333;
}

.theme--light .event-compact {
  border: 1px solid #e9e9e9;
}

.event-compact a {
  text-decoration: none;
}

.event-compact a:hover,
.event-compact a:focus {
  text-decoration: underline;
}

.event-compact__thumblink {
  flex: 0 0 96px;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.event-compact__thumb.img {
  flex: 1 1 auto;
  height: auto;
  align-items: stretch;
}

.event-compact__thumb.img.thumb img {
  min-height: 0;
  height: auto;
  align-self: stretch;
  width: 96px;
  aspect-ratio: auto;
  object-fit: cover;
}

.event-compact__body {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
  min-width: 0;
  padding: 8px;
}

.event-compact__title {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
  font-family: 'VT323', monospace !important;
  font-size: 1.25rem;
  line-height: 1.1;
}

.event-compact__meta {
  display: block;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-compact .v-icon {
  opacity: 0.6;
}
</style>
