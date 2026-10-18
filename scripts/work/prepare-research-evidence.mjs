/** Optimized derivatives of Lead Research application captures with fictional data. */
import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const output = resolve(root, 'public/work/research')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const captures = [
  ['pipeline', 'screenshots/01-pipeline.png'],
  ['lead-assessment', 'screenshots/02-lead-assessment.png'],
  ['research-outreach', 'screenshots/03-research-outreach.png'],
  ['shortlist-review', 'screenshots/04-shortlist-review.png'],
]
const provenance = []
try {
  const page = await browser.newPage()
  for (const [name, path] of captures) {
    const png = await readFile(resolve(root, '../lead-research', path))
    const image = await page.evaluate(async (data) => {
      const original = new Image()
      original.src = `data:image/png;base64,${data}`
      await original.decode()
      for (const width of [1080, 900]) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round((width * original.height) / original.width)
        canvas
          .getContext('2d')
          .drawImage(original, 0, 0, canvas.width, canvas.height)
        for (const quality of [0.8, 0.72, 0.64, 0.56, 0.48]) {
          const encoded = canvas.toDataURL('image/webp', quality).split(',')[1]
          if (atob(encoded).length <= 50000)
            return { encoded, width, height: canvas.height, quality }
        }
      }
      throw new Error('Evidence cannot meet the 50KB budget')
    }, png.toString('base64'))
    const bytes = Buffer.from(image.encoded, 'base64')
    await writeFile(resolve(output, name + '.webp'), bytes)
    provenance.push({
      name,
      source: 'lead-research/' + path,
      width: image.width,
      height: image.height,
      quality: image.quality,
      bytes: bytes.length,
      qualification:
        'Actual application capture with fictional browser-local fixtures; no live backend or AI provider calls.',
    })
    console.log(name, bytes.length, 'bytes', image.width + '×' + image.height)
  }
  await writeFile(
    resolve(root, 'assets/work/research/evidence.json'),
    JSON.stringify(provenance, null, 2) + '\n',
  )
} finally {
  await browser.close()
}
