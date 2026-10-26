/**
 * Event images are stored as `<name>.jpg` (1200px) and `thumb/<name>.jpg`
 * (500px), each with a WebP copy next to it as `<name>.jpg.webp`. nginx serves
 * the copy at the JPEG's URL to browsers that accept WebP, so URLs, stored media
 * and API responses stay JPEG. A missing copy just means the JPEG is served.
 */
const fs = require('fs/promises')
const path = require('path')
const config = require('../config')
const log = require('../log')

const WEBP_OPTIONS = {
  thumb: { quality: 75 },
  full: { quality: 80 }
}

const webpPath = jpgPath => jpgPath + '.webp'

// Both sizes of an event image and their WebP copies
async function removeMediaFiles (url) {
  const jpgs = [path.join(config.upload_path, url), path.join(config.upload_path, 'thumb', url)]
  const results = await Promise.allSettled([...jpgs, ...jpgs.map(webpPath)].map(file => fs.unlink(file)))
  for (const { status, reason } of results) {
    if (status === 'rejected' && reason.code !== 'ENOENT') {
      log.info(reason.toString())
    }
  }
}

module.exports = { WEBP_OPTIONS, webpPath, removeMediaFiles }
