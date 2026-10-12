import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const theme = process.argv[2]
if (!['product', 'ai', 'workflow', 'integration'].includes(theme))
  throw new Error('Choose product, ai, workflow, or integration.')
const source = resolve(root, 'assets/services', theme)
const output = resolve(root, 'public/services', theme)
const png = await readFile(resolve(source, `${theme}-hero.png`))
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const assets = []
  for (const [width, suffix, budget] of [
    [1400, '', 80_000],
    [768, '-mobile', 35_000],
  ]) {
    const image = await page.evaluate(
      async ({ data, targetWidth }) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        )
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = Math.round((targetWidth * bitmap.height) / bitmap.width)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Image canvas unavailable.')
        context.imageSmoothingQuality = 'high'
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const result = {
          height: canvas.height,
          data: canvas.toDataURL('image/webp', 0.86).split(',')[1],
        }
        bitmap.close()
        return result
      },
      { data: png.toString('base64'), targetWidth: width },
    )
    const bytes = Buffer.from(image.data, 'base64')
    if (bytes.length > budget)
      throw new Error(`${theme}${suffix} exceeds its ${budget}-byte budget.`)
    const filename = `${theme}-hero${suffix}.webp`
    await writeFile(resolve(output, filename), bytes)
    assets.push({ filename, width, height: image.height, bytes: bytes.length })
  }
  await writeFile(
    resolve(source, 'images.json'),
    `${JSON.stringify({ master: `${theme}-hero.png`, assets }, null, 2)}\n`,
  )
  console.log(assets)
} finally {
  await browser.close()
}
