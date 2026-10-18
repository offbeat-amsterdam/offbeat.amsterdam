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
      <v-icon v-text='mdiCalendarRange' />
      {{ $time.until(event) }}
    </time>

    <div class='event-compact__meta p-location'>
      <template v-if='isOnline'>
        <v-icon v-text='mdiMapMarkerMultiple' />
        <span>{{ $t('common.multiple_locations') }}</span>
      </template>
      <nuxt-link v-else class='place'
        :to='`/place/${event.place.id}/${encodeURIComponent(event.place.name)}`'>
        <v-icon v-text='mdiMapMarker' />
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
/* Sized like the regular event cards on phones (assets/style.css): a 112px
   square image, the same title and text sizes, the same hover outline */
.event-compact {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  max-width: 330px;
  overflow: hidden;
  transition: border-color .5s;
}

.theme--dark .event-compact {
  border: 1px solid #333;
}

.theme--light .event-compact {
  border: 1px solid #e9e9e9;
}

.theme--light .event-compact:hover {
  border-color: #DB3B00;
}

.theme--dark .event-compact:hover {
  border-color: #FF6E40;
}

.event-compact a {
  text-decoration: none;
}

/* as the regular cards: no underline on hover except the venue
   (assets/style.css), kept for keyboard focus */
.event-compact a:focus-visible {
  text-decoration: underline;
}

.event-compact__thumblink {
  flex: 0 0 112px;
  display: flex;
  overflow: hidden;
}

/* the same square on every card, whatever the height of the text next to it */
.event-compact__thumb.img {
  width: 112px;
  height: 112px;
}

.event-compact__thumb.img.thumb img {
  width: 112px;
  height: 112px;
  min-height: 0;
  max-height: none;
  aspect-ratio: auto;
  object-fit: cover;
}

.event-compact__body {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4px;
  min-width: 0;
  padding: 0.5rem 0.75rem;
}

.event-compact__title {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
  font-family: 'VT323', monospace !important;
  /* as .event .title, and 1.15em on phones as .h-event.has-thumb .title */
  font-size: 1.3em;
  line-height: 1.2em;
}

/* as the date and venue of the regular cards (Vuetify's .v-card__text),
   wrapping like there instead of cutting off */
.event-compact__meta {
  display: block;
  font-size: 0.875rem;
  line-height: 1.375rem;
  letter-spacing: 0.0071428571em;
}

/* as assets/style.css forces for .v-card__text */
.theme--light .event-compact__meta {
  color: black;
}

.theme--dark .event-compact__meta {
  color: white;
}

@media only screen and (max-width: 600px) {
  .event-compact__title {
    font-size: 1.15em;
  }
}
</style>
