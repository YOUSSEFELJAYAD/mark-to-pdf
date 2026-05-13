import { test, expect } from '@playwright/test'

const PAGES = [
  { path: '/', titleContains: 'Markdown to PDF' },
  { path: '/privacy', titleContains: 'Privacy' },
  { path: '/terms', titleContains: 'Terms' },
  { path: '/contact', titleContains: 'Contact' },
  { path: '/how-to-convert-markdown-to-pdf', titleContains: 'How to Convert Markdown to PDF' },
  { path: '/markdown-to-docx', titleContains: 'Markdown to DOCX' },
  { path: '/markdown-cheatsheet', titleContains: 'Cheatsheet' },
  { path: '/examples', titleContains: 'Examples' },
]

test.describe('SEO metadata', () => {
  for (const { path, titleContains } of PAGES) {
    test(`${path} has title containing "${titleContains}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(new RegExp(titleContains, 'i'))
    })

    test(`${path} has a non-empty meta description`, async ({ page }) => {
      await page.goto(path)
      const desc = await page.locator('meta[name="description"]').getAttribute('content')
      expect(desc).toBeTruthy()
      expect(desc!.length).toBeGreaterThan(50)
      expect(desc!.length).toBeLessThan(170)
    })

    test(`${path} has a canonical URL`, async ({ page }) => {
      await page.goto(path)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toContain('marktopdf.com')
    })

    test(`${path} declares an OpenGraph image`, async ({ page }) => {
      await page.goto(path)
      const og = await page.locator('meta[property="og:image"]').first().getAttribute('content')
      expect(og).toBeTruthy()
    })
  }
})
