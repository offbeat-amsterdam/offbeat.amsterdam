<template lang="pug">
v-card
  v-card-title SMTP Email configuration
  v-card-text
    p(v-html="$t('admin.smtp_description')")
    v-form(v-model='isValid')

      v-text-field(v-model='admin_email'
        @blur="save('admin_email', admin_email )"
        :label="$t('admin.admin_email')"
        :hint="$t('admin.admin_email_help')"
        persistent-hint
        :rules="$validators.email")

      v-switch(v-model='smtp.sendmail' inset
        :label="$t('admin.smtp_use_sendmail')")

      v-row(v-if='!smtp.sendmail')
        v-col(cols=12 md=9)
          v-text-field(v-model='smtp.host'
            :label="$t('admin.smtp_hostname')"
            :rules="[$validators.required('admin.smtp_hostname')]")
        v-col(cols=12 md=3)
          v-text-field(v-model='smtp.port'
            :label="$t('admin.smtp_port')"
            :rules="[$validators.required('admin.smtp_port')]")

        v-col(cols=12)
          v-switch(v-model='smtp.secure' inset
            :label="$t('admin.smtp_secure')")

        v-col(md=6)
          v-text-field(v-model='smtp.auth.user'
            :label="$t('common.user')")

        v-col(md=6)
          v-text-field(v-model='smtp.auth.pass'
            persistent-hint
            :hint="$t('admin.smtp_password_description')"
            :label="$t('common.password')"
            type='password')

  v-card-actions
    v-spacer
    v-btn(color='primary' @click='done(true)' :loading='loading' :disabled='loading || !isValid' outlined) {{$t('admin.smtp_test_button')}}
    v-btn(color='warning' @click="done(false)" outlined) {{$t("common.ok")}}

</template>
<script>
import { mapActions, mapState } from 'vuex'
export default {
  data ({ $store }) {
    return {
      isValid: false,
      loading: false,
      smtp: { auth: {} },
      admin_email: $store.state.settings.admin_email || ''
    }
  },
  async fetch () {
    this.smtp = await this.$axios.$get('/settings/smtp').catch(_e => ({ auth: {} }))
    if (!this.smtp.auth) {
      this.smtp.auth = {}
    }
  },
  computed: mapState(['settings']),
  methods: {
    ...mapActions(['setSetting']),
    save (key, value) {
      if (this.settings[key] !== value) {
        this.setSetting({ key, value })
      }
    },
    async done (testing) {
      const smtp = JSON.parse(JSON.stringify(this.smtp))
      if (!smtp.auth.user) {
        delete smtp.auth
      }

      // override past `ignoreTLS` smtp setting
      smtp.ignoreTLS = false

      smtp.port = Number(smtp.port)
      // force encryption based on selected port, see https://framagit.org/les/gancio/-/issues/192
      if (smtp.secure) {
        if (smtp.port === 465) {
          smtp.secure = true
          smtp.requireTLS = false
        } else {
          smtp.secure = false
          smtp.requireTLS = true
        }
      } else {
        // use TLS immediately for port 465
        // this is recommended in nodemailer documentation
        smtp.secure = smtp.port === 465
        smtp.requireTLS = false
      }

      if (testing) {
        this.loading = true
        try {
          await this.$axios.$post('/settings/test_smtp', { smtp })
          this.$root.$message(this.$t('admin.smtp_test_success', { admin_email: this.admin_email }), { color: 'success' })
        } catch (e) {
          this.$root.$message(e.response && e.response.data, { color: 'error' })
        }
        this.loading = false
      } else {
        this.setSetting({ key: 'smtp', value: smtp })
        this.$emit('close')
      }
    }
  }
}
</script>