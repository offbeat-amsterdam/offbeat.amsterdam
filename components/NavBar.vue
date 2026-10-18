<template>
  <!-- feeds and embedding (/export) moved to the menu (NavHeader.vue) -->
  <v-tabs v-if='$auth.loggedIn || settings.allow_anon_event' id='navbar' centered background-color='transparent' optional dense icons-and-text class='mt-4'>
    <v-tab to='/add' :ripple="false" :aria-label="$t('common.add_event')">
      <span class='d-none d-sm-flex'>{{$t('common.add_event')}}</span>
      <v-icon color='primary' v-text='mdiPlus' />
    </v-tab>
  </v-tabs>    
</template>

<script>
import { mdiPlus, mdiHome, mdiInformation } from '@mdi/js'
import { mapState } from 'vuex'

export default {
  name: 'Navbar',
  data () { 
    return { mdiPlus, mdiHome, mdiInformation }
  },
  computed: mapState(['settings'])
}
</script>
