const fs = require('fs/promises')
const path = require('path')

/**
 * Create the WebP copies of event images uploaded before they existed
 * (see server/helpers/media.js). Safe to run again: existing copies are
 * skipped unless --force is given.
 */
async function webp (args) {
  const sharp = require('sharp')
  const config = require('../config')
  const { WEBP_OPTIONS, webpPath } = require('../helpers/media')

  const dirs = [
    { dir: path.resolve(config.upload_path, 'thumb'), options: WEBP_OPTIONS.thumb },
    { dir: config.upload_path, options: WEBP_OPTIONS.full }
  ]

  const todo = []
  for (const { dir, options } of dirs) {
    const names = new Set(await fs.readdir(dir))
    for (const name of names) {
      if (name.endsWith('.jpg') && (args.force || !names.has(name + '.webp'))) {
        todo.push({ file: path.join(dir, name), options })
      }
    }
  }
  console.log(`${todo.length} images to convert`)

  let done = 0
  let failed = 0
  const worker = async () => {
    while (todo.length) {
      const { file, options } = todo.pop()
      try {
        await sharp(file).webp(options).toFile(webpPath(file))
      } catch (e) {
        failed++
        console.error(`${file}: ${e.message}`)
      }
      if (++done % 500 === 0) console.log(`${done} done`)
    }
  }
  await Promise.all(Array.from({ length: args.concurrency }, worker))
  console.log(`Converted ${done - failed} images, ${failed} failed`)
}

const mediaCLI = yargs => yargs
  .command('webp', 'Create WebP copies of existing event images', {
    force: { type: 'boolean', default: false, describe: 'Recreate existing copies' },
    concurrency: { type: 'number', default: 2, describe: 'Images converted in parallel' }
  }, webp)
  .recommendCommands()
  .demandCommand(1, '')
  .argv

module.exports = mediaCLI
