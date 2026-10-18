const config = require('./server/config.js')
const locales = require('./locales/index')
const dns = require('node:dns')
dns.setDefaultResultOrder('ipv4first')
const settingsController = require('./server/api/controller/settings')
require('./server/routes') // eager-load so rate limiters initialize outside request context

export default {
  publicRuntimeConfig: {
    settings: {
      footerLinks: settingsController.settings.footerLinks
    },
  },
}

const isDev = (process.env.NODE_ENV !== 'production')
module.exports = {
  telemetry: false,
  modern: (process.env.NODE_ENV === 'production') && 'client',
  /*
   ** Headers of the page
   */
  head: {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ],
    // fonts are otherwise only found once the main CSS is parsed (assets/style.css)
    link: [
      { rel: 'preload', as: 'font', type: 'font/woff', href: '/vt323-latin-400-normal.woff', crossorigin: 'anonymous' },
      { rel: 'preload', as: 'font', type: 'font/woff2', href: '/share-tech-mono-v15-latin-regular.woff2', crossorigin: 'anonymous' }
    ]
  },
  dev: isDev,
  server: config.server,


  vue: {
    config: {
      ignoredElements: ['gancio-events', 'gancio-event']
    }
  },

  css: ['./assets/style.css'],

  /*
   ** Customize the progress-bar component
   */
  loading: {
    color: 'orangered',
    height: '3px'
  }, //'~/components/Loading.vue',
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '@/plugins/helpers',
    '@/plugins/time', // datetime filters
    '@/plugins/axios', // axios baseurl configuration
    '@/plugins/validators', // inject validators
    '@/plugins/api', // api helpers
    '@/plugins/i18n',
    '@/plugins/formatter',
    { src: '@/plugins/v-calendar', ssr: false } // v-calendar
  ],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/i18n',
    '~/modules/axios-proxy.js', // Note: import this before @nuxtjs/axios to override defaults of both instances: `$axios` available in context, and `axios` used in controllers
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/sitemap',
    ['cookie-universal-nuxt', { alias: 'cookies' }],
  ],

  sitemap: {
    hostname: config.baseurl,
    gzip: true,
    exclude: [
      '/Admin',
      '/settings',
      '/export',
      '/setup',
      '/Login',
      '/Authorize',
      '/my_events',
      '/Register',
      '/search'
    ],
    cacheTime: 1000 * 60 * 10,
    routes: async () => {
      const routes = [
        {
          url: '/',
          changefreq: 'daily'
        }
      ]
      // Loopback, like SSR API calls (plugins/axios.js): the public URL goes
      // through nginx, which answers with an HTML error page while Gancio restarts
      const getJSON = async path => {
        const res = await fetch(`http://127.0.0.1:${config.server.port}/api${path}`)
        if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
        return res.json()
      }
      try {
        // Events
        const events = await getJSON('/events')
        routes.push(
          ...events.map(e => ({
            url: `/event/${e.slug || e.id}`,
            changefreq: 'weekly'
          }))
        )

        // Places
        const places = await getJSON('/places')
        routes.push(
          ...places.map(p => ({
            url: `/place/${p.id}/${encodeURIComponent(p.name)}`,
            changefreq: 'daily',
          }))
        )

        // 'Footer' links (only internal)
        routes.push(
          ...settingsController.settings.footerLinks
            .filter(l => l.href.startsWith('/'))
            .map(l => ({
              url: l.href,
              changefreq: 'monthly'
            }))
        )
      } catch (e) {
        console.error('Sitemap generation failed:', e)
      }
      return routes
    }
  },
  i18n: {
    locales: Object.keys(locales).map(key => ({
      code: key,
      name: locales[key],
      file: 'loader.js',
      language: key
    })),
    vueI18n: {
      fallbackLocale: 'en',
      silentTranslationWarn: true
    },
    langDir: 'locales',
    lazy: true,
    strategy: 'no_prefix',
    skipSettingLocaleOnNavigate: true,
    defaultLocale: 'en',
  },
  render: {
    static: {
      maxAge: "6000000"
    }
  },

  serverMiddleware: ['server/routes'],

  /*
   ** Axios module configuration
   * See https://github.com/nuxt-community/axios-module#options
   */
  axios: {
    prefix: '/api'
  },
  auth: {
    rewriteRedirects: true,
    fullPathRedirect: true,
    // localStorage: false, // https://github.com/nuxt-community/auth-module/issues/425
    cookie: {
      prefix: 'auth.',
      options: {
        sameSite: !isDev && 'Lax',
        // enable secure cookie only for https baseurl, ref #572
        secure: !isDev && /^https:/.test(config.baseurl),
        maxAge: 60 * 60 * 24 * 30 * 12 * 5
      }
    },
    strategies: {
      local: {
        endpoints: {
          login: {
            url: '../oauth/login',
            method: 'post',
            propertyName: 'access_token',
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          },
          logout: false,
          user: { url: '/user', method: 'get', propertyName: false, autoFetch: false }
        },
        tokenRequired: true,
        tokenType: 'Bearer'
      }
    }
  },
  buildModules: ['@nuxtjs/vuetify'],
  vuetify: {
    treeShake: true,
    defaultAssets: false,
    optionsPath: './vuetify.options.js',
    customVariables: ['~/assets/variables.scss']
  },
  hooks: {
    listen(server) {
      // Must exceed nginx's upstream `keepalive_timeout` (70s) so Node never
      // closes a pooled connection that nginx still considers reusable,
      // which otherwise surfaces as ECONNRESET / 502s on the next reuse.
      server.keepAliveTimeout = 75000;
      server.headersTimeout = 76000;
    }
  },
  build: {
    extend(config, { isDev, isClient }) {
      // ..
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
      })
      // Sets webpack's mode to development if `isDev` is true.
      if (isDev) {
        config.mode = 'development'
      }
    },
    corejs: 3,
    cache: true,
    hardSource: !isDev,
    extractCSS: !isDev,
    optimizeCSS: !isDev
  },
}
