/** Resize/crop original Blender renders and record matching viewer geometry.
 * Run: node scripts/work/prepare-work-posters.mjs care (or accounting)
 */
import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const theme = process.argv[2]
if (
  !['care', 'accounting', 'research', 'services', 'robotics', 'about'].includes(
    theme,
  )
)
  throw new Error(
    'Choose care, accounting, research, services, robotics or about',
  )
const root = resolve(import.meta.dirname, '../..')
const source = resolve(root, 'assets/work', theme)
const publicPath = resolve(root, 'public/work', theme)
const manifest = JSON.parse(
  await readFile(resolve(source, 'manifest.json'), 'utf8'),
)
const png = await readFile(resolve(source, `${theme}-hero.png`))
const glb = await readFile(resolve(publicPath, `${theme}-hero.glb`))
if (
  glb.toString('ascii', 0, 4) !== 'glTF' ||
  glb.readUInt32LE(4) !== 2 ||
  glb.readUInt32LE(8) !== glb.length ||
  glb.length > 320_000
)
  throw new Error('Model invalid or over budget')
const model = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)))
if (
  model.buffers.some((buffer) => buffer.uri) ||
  model.images?.some((image) => image.uri)
)
  throw new Error('External model dependencies')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  let view
  for (const [width, quality, suffix, budget] of [
    [1400, 0.88, '', 80000],
    [768, 0.86, '-mobile', 35000],
  ]) {
    const image = await page.evaluate(
      async ({ data, outputWidth, outputQuality }) => {
        const original = new Image()
        original.src = `data:image/png;base64,${data}`
        await original.decode()
        const scan = document.createElement('canvas')
        scan.width = original.width
        scan.height = original.height
        const context = scan.getContext('2d')
        context.drawImage(original, 0, 0)
        const pixels = context.getImageData(0, 0, scan.width, scan.height).data
        let left = scan.width,
          top = scan.height,
          right = 0,
          bottom = 0
        for (let y = 0; y < scan.height; y++)
          for (let x = 0; x < scan.width; x++) {
            if (pixels[(y * scan.width + x) * 4 + 3] > 8) {
              left = Math.min(left, x)
              top = Math.min(top, y)
              right = Math.max(right, x)
              bottom = Math.max(bottom, y)
            }
          }
        left = Math.max(0, left - 60)
        top = Math.max(0, top - 60)
        right = Math.min(scan.width, right + 60)
        bottom = Math.min(scan.height, bottom + 60)
        const bounds = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        }
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = Math.round((outputWidth * bounds.height) / bounds.width)
        canvas
          .getContext('2d')
          .drawImage(
            original,
            left,
            top,
            bounds.width,
            bounds.height,
            0,
            0,
            canvas.width,
            canvas.height,
          )
        return {
          data: canvas.toDataURL('image/webp', outputQuality).split(',')[1],
          width: canvas.width,
          height: canvas.height,
          bounds,
        }
      },
      {
        data: png.toString('base64'),
        outputWidth: width,
        outputQuality: quality,
      },
    )
    const bytes = Buffer.from(image.data, 'base64')
    if (bytes.length > budget)
      throw new Error(`Poster exceeds budget: ${bytes.length} > ${budget}`)
    await writeFile(resolve(publicPath, `${theme}-hero${suffix}.webp`), bytes)
    if (!suffix) {
      const { bounds } = image
      const unit = manifest.orthographicScale / manifest.resolution[0]
      view = {
        width: image.width,
        height: image.height,
        sourceBounds: bounds,
        camera: [manifest.camera[0], manifest.camera[2], -manifest.camera[1]],
        target: [manifest.target[0], manifest.target[2], -manifest.target[1]],
        horizontalSpan: unit * bounds.width,
        verticalSpan: unit * bounds.height,
        cropShift: [
          (bounds.x + bounds.width / 2 - manifest.resolution[0] / 2) * unit,
          (manifest.resolution[1] / 2 - bounds.y - bounds.height / 2) * unit,
        ],
      }
      await writeFile(
        resolve(source, 'view.json'),
        JSON.stringify(view, null, 2) + '\n',
      )
    }
    console.log(
      `${theme}${suffix}: ${bytes.length} bytes, ${image.width} × ${image.height}`,
    )
  }
  console.log(
    `Self-contained model: ${glb.length} bytes; ${manifest.triangles} triangles`,
  )
} finally {
  await browser.close()
}
