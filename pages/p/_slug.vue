<template>
  <v-row class="justify-center align-center">
    <v-col cols="12" sm="10" md="8" lg="6" xl="6">
      <v-container>
        <h1 class="title text-center text-uppercase text-h4 mt-10 mx-auto w-100">
          <strong>{{ page.title }}</strong>
        </h1>
        <v-card>
          <v-card-text v-html='page.content' class="body-1" />
        </v-card>
      </v-container>
    </v-col>
  </v-row>
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
        title: `${this.page.title} | ${this.settings.title}`
      }
    },
    computed: mapState(['settings'])
  }
  </script>
