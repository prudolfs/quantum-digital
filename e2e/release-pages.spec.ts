import { expect, test } from '@playwright/test'
import { caseStudies } from '../src/content/site'

const origin = 'https://quantum-digital.pukitis-rudolfs.workers.dev'

test('all work and About routes expose matching canonical, social metadata and sitemap entries', async ({
  page,
  request,
}) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const xml = await sitemap.text()
  expect(xml).not.toContain('/admin')
  for (const { path, title } of [
    { path: '/about', title: 'About | Quantum Digital' },
    ...caseStudies.map((study) => ({
      path: `/work/${study.slug}`,
      title: `${study.title} | Quantum Digital`,
    })),
  ]) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      origin + path,
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      title,
    )
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      origin + path,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      origin + '/social-preview.png',
    )
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /\S/,
    )
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    expect(xml).toContain(`<loc>${origin}${path}</loc>`)
    const images = page.locator('.work-model-poster')
    await expect(images).toBeVisible()
    await expect(images).toHaveJSProperty('complete', true)
    expect(
      await images.evaluate(
        (image) => (image as HTMLImageElement).naturalWidth,
      ),
    ).toBeGreaterThan(0)
  }
  const social = await request.get('/social-preview.png')
  expect(social.status()).toBe(200)
  expect(social.headers()['content-type']).toContain('image/png')
  expect((await request.get('/work/not-a-published-project')).status()).toBe(
    404,
  )
})

test('every homepage work card reaches its complete published story', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const study of caseStudies) {
    await page.goto('/#work')
    const link = page
      .locator('#work')
      .getByRole('link', { name: new RegExp(study.title) })
    await link.scrollIntoViewIfNeeded()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`/work/${study.slug}$`))
    await expect(page.locator('.work-hero .eyebrow')).toContainText(study.title)
    await expect(page.locator('.work-steps button').first()).toBeVisible()
  }
})
