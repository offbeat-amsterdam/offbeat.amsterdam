<template>
  <v-container>
    <v-card>
      <v-card-title class='text-h4 font-weight-bold'>{{ page.title }}</v-card-title>
      <v-card-text v-html='page.content' />
    </v-card>
  </v-container>
</template>
<script>
import { mapState } from 'vuex'
  
  export default {
    name: 'Page',
    async asyncData ({ params, error, $axios }) {
      try {
        const page = await $axios.$get(`/pages/${params.slug}`)
        return { page }
      } catch (e) {
        error({
          statusCode: e?.response?.status ?? 500,
          message: e?.response?.data?.message ?? e?.response?.data ?? e?.message ?? 'Request failed'
        })
      }
    },
    data () {
      return { page: { title: '' } }
    },
    head () {
      if (!this.page) {
        return {}
      }
      return {
        htmlAttrs: {
          lang: this.settings.instance_locale
        },
        title: `${this.settings.title} - ${this.page.title}`
      }
    },
    computed: mapState(['settings'])
  }
  </script>
  