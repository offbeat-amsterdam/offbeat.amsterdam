<template>
  <nav>
    <NavHeader />

    <!-- title -->
    <h1 v-if="$route.name === 'index'" class="text-center">
      <nuxt-link id="title" v-text="settings.title" to="/" />
      <div
        class="tagline text-body-1 font-weight-light mx-3 mx-sm-5 my-2 my-sm-5 pb-sm-3"
        v-html="settings?.description"
      />
    </h1>
    <div v-else class="text-center">
      <nuxt-link id="title" v-text="settings.title" to="/" />
      <div
        class="tagline text-body-1 font-weight-light mx-3 mx-sm-5 my-2 my-sm-5 pb-sm-3"
        v-html="settings?.description"
      />
    </div>

    <NavSearch />
    <NavBar v-if="!['event-slug','e-slug'].includes($route.name)"/>
  </nav>
</template>
<script>
import { mapState } from 'vuex'
import NavHeader from './NavHeader.vue'
import NavBar from './NavBar.vue'
import NavSearch from './NavSearch.vue'

export default {
  name: 'Appbar',
  components: { NavHeader, NavBar, NavSearch },
  computed: mapState(['settings']),
}
</script>
<style>

/* the patterned background ends 12px below its last control (e.g. Show calendar) */
nav {
  padding-bottom: 12px;
}

/* The glow is anchored behind the title and tagline with a fixed size, so it
   stays put when the venues or calendar below open and the nav grows */
.theme--dark nav {
  background:
      radial-gradient(circle 70vmin at 50% 220px, #312737, transparent),
      conic-gradient(from 90deg at 1px 1px, transparent 60deg, #292929 0)
      0 0/20px 20px;
}

.theme--light nav {
  background:
      radial-gradient(circle 70vmin at 50% 220px, #f3e9ff, transparent),
      conic-gradient(from 90deg at 1px 1px, transparent 60deg, #fdebeb 0)
      0 0/20px 20px;
}

#title {
  word-break: break-word;
  font-size: 3.5rem;
  font-weight: 600;
  text-decoration: none;
  font-family: 'VT323', monospace !important;
}

@media (max-width: 600px) {
  /* fits `[offbeat amsterdam]` on one line on phones */
  #title {
      font-size: 2.25rem;
      line-height: 1;
  }

  /* the full tagline in fewer lines: smaller, and without the extra letter
     spacing of text-body-1, which widens monospace text a lot */
  .v-application .tagline {
      font-size: 0.875rem !important;
      line-height: 1.4 !important;
      letter-spacing: normal !important;
  }
}

#title::before {
  content: "[";
}

#title::after {
  content: "]";
}
</style>
