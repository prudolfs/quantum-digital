import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const svg = await readFile(resolve(root, 'public/social-preview.svg'), 'utf8')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block}</style>${svg}`,
  )
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: resolve(root, 'public/social-preview.png') })
} finally {
  await browser.close()
}
