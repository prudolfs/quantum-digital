import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const theme = process.argv[2]
if (!['product', 'ai', 'workflow', 'integration'].includes(theme))
  throw new Error('Choose product, ai, workflow, or integration.')
const variant = process.argv[3] ?? 'hero'
if (!['hero', '--lighting', '--background'].includes(variant))
  throw new Error('Use --lighting or --background for model appearance assets.')
const source = resolve(root, 'assets/services', theme)
const output = resolve(root, 'public/services', theme)
const png = await readFile(
  resolve(
    source,
    `${theme}-${variant === '--background' ? 'background' : 'hero'}.png`,
  ),
)
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const assets = []
  const variants =
    variant === 'hero'
      ? [
          [1400, '', 80_000],
          [768, '-mobile', 35_000],
        ]
      : [[1400, '', variant === '--lighting' ? 160_000 : 35_000]]
  for (const [width, suffix, budget] of variants) {
    const image = await page.evaluate(
      async ({ data, targetWidth, lighting }) => {
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
          data: canvas
            .toDataURL(
              lighting ? 'image/jpeg' : 'image/webp',
              lighting ? 0.94 : 0.86,
            )
            .split(',')[1],
        }
        bitmap.close()
        return result
      },
      {
        data: png.toString('base64'),
        targetWidth: width,
        lighting: variant === '--lighting',
      },
    )
    const bytes = Buffer.from(image.data, 'base64')
    if (bytes.length > budget)
      throw new Error(`${theme}${suffix} exceeds its ${budget}-byte budget.`)
    const filename =
      variant === '--lighting'
        ? `${theme}-lighting.jpg`
        : `${theme}-${variant === '--background' ? 'background' : 'hero'}${suffix}.webp`
    await writeFile(
      resolve(variant === '--lighting' ? source : output, filename),
      bytes,
    )
    assets.push({ filename, width, height: image.height, bytes: bytes.length })
  }
  await writeFile(
    resolve(
      source,
      variant === 'hero' ? 'images.json' : `${variant.slice(2)}.json`,
    ),
    `${JSON.stringify({ master: `${theme}-${variant === '--background' ? 'background' : 'hero'}.png`, assets }, null, 2)}\n`,
  )
  console.log(assets)
} finally {
  await browser.close()
}
