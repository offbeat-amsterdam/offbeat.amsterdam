const { monitorEventLoopDelay } = require('perf_hooks')
const axios = require('axios')
const log = require('./log')

// Outbound HTTP (federation inboxes, nodeinfo, remote actors...) must never
// wait forever: axios defaults to no timeout, so one dead remote instance
// leaks a pending request per delivery until the process is restarted.
const HTTP_TIMEOUT_MS = 15000

// Report when the event loop was blocked longer than this in the last window
const EVENT_LOOP_WARN_MS = 1000
const EVENT_LOOP_WINDOW_MS = 30000

// Queries slower than this are logged as warnings
const SLOW_QUERY_MS = 1000

const mb = bytes => Math.round(bytes / 1024 / 1024)

const diagnostics = {
  SLOW_QUERY_MS,

  start () {
    axios.defaults.timeout = HTTP_TIMEOUT_MS

    const histogram = monitorEventLoopDelay({ resolution: 20 })
    histogram.enable()

    setInterval(() => {
      const max = histogram.max / 1e6
      if (max >= EVENT_LOOP_WARN_MS) {
        const mem = process.memoryUsage()
        log.warn(`[DIAGNOSTICS] Event loop blocked up to ${Math.round(max)}ms ` +
          `(p99 ${Math.round(histogram.percentile(99) / 1e6)}ms) in the last ${EVENT_LOOP_WINDOW_MS / 1000}s ` +
          `- rss ${mb(mem.rss)}MB, heap ${mb(mem.heapUsed)}/${mb(mem.heapTotal)}MB`)
      }
      histogram.reset()
    }, EVENT_LOOP_WINDOW_MS).unref()

    log.info(`[DIAGNOSTICS] HTTP timeout ${HTTP_TIMEOUT_MS}ms, event loop warn ${EVENT_LOOP_WARN_MS}ms, slow query ${SLOW_QUERY_MS}ms`)
  },

  // Sequelize `logging` callback (requires `benchmark: true`)
  logQuery (sql, ms) {
    if (ms >= SLOW_QUERY_MS) {
      log.warn(`[DIAGNOSTICS] Slow query (${ms}ms): ${sql.slice(0, 2000)}`)
    }
  }
}

module.exports = diagnostics
