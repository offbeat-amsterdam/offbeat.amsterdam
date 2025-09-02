const fetch = require('node-fetch')
const { parseIcsData } = require('../../helpers/icsparser')
const log = require('../../log')

const icsController = {
  async importICSURL (req, res) {
    log.debug('[ICS-IMPORT] Start ICS URL import')
    const { url, includePastEvents = false } = req.body
    if (!url) {
      return res.status(400).json({ success: false, error: 'No URL provided' })
    }

    try {
      const icsText = await fetch(url).then(res => res.text())
      const events = parseIcsData(icsText, includePastEvents)
      res.json({ success: true, events })
    } catch (err) {
      console.error('ICS URL error:', err)
      res.status(500).json({ success: false, error: 'Error while fetching or parsing ICS data' })
    }
  },

  // POST /ics-import  mit { icsText: '...raw text...' }
  importICSFile (req, res) {
    log.debug('[ICS-IMPORT] POST /api/ics-import ')

    const { icsText, includePastEvents } = req.body

    if (!icsText) {
      log.error('[ICS-IMPORT] No ICS text received')
      return res.status(400).json({ success: false, error: 'No ICS text received' })
    }

    try {
      const events = parseIcsData(icsText, includePastEvents === true)
      log.info(`[ICS-IMPORT] Found ${events.length} event(s)`)
      res.json({ success: true, events })
    } catch (err) {
      console.error('ICS error (POST):', err)
      res.status(500).json({ success: false, error: 'Error while try to parse ics text' })
    }
  }
}

module.exports = icsController
