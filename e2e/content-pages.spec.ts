import { test, expect } from '@playwright/test'

const PAGES = [
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Service' },
  { path: '/contact', heading: 'Contact' },
  { path: '/how-to-convert-markdown-to-pdf', heading: 'How to Convert Markdown to PDF' },
  { path: '/markdown-to-docx', heading: 'Markdown to DOCX Converter' },
  { path: '/markdown-cheatsheet', heading: 'Markdown Cheatsheet' },
  { path: '/examples', heading: 'Markdown Examples' },
]

test.describe('Content pages', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders with H1 containing "${heading}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('h1').first()).toContainText(heading)
      await expect(
        page.getByRole('link', { name: /Home|Back to the converter|Open the converter|Try the converter/i }).first(),
      ).toBeVisible()
    })
  }

  test('Examples page has Try in editor links pointing to /?example=', async ({ page }) => {
    await page.goto('/examples')
    const tryLinks = page.getByRole('link', { name: /Try in editor/i })
    await expect(tryLinks.first()).toBeVisible()
    const href = await tryLinks.first().getAttribute('href')
    expect(href).toMatch(/^\/\?example=/)
  })

  test('Example query-param loads example into editor when sample is unchanged', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())

    await page.goto('/?example=resume')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('Jane Doe')
  })
})
