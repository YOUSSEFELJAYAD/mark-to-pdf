import { test, expect } from '@playwright/test'

const PAGES = [
  '/',
  '/privacy',
  '/terms',
  '/contact',
  '/how-to-convert-markdown-to-pdf',
  '/markdown-to-docx',
  '/markdown-cheatsheet',
  '/examples',
]

test.describe('Site header', () => {
  for (const path of PAGES) {
    test(`${path} has site header with logo + nav`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('[data-testid="site-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="site-header-home"]')).toBeVisible()
      await expect(page.locator('[data-testid="site-header"] svg').first()).toBeVisible()
      await expect(page.locator('[data-testid="site-header"]').getByText('Mark to PDF')).toBeVisible()
    })
  }

  test('home logo link points to /', async ({ page }) => {
    await page.goto('/markdown-cheatsheet')
    const href = await page.locator('[data-testid="site-header-home"]').getAttribute('href')
    expect(href).toBe('/')
  })

  test('header nav links point to the three content pages', async ({ page }) => {
    await page.goto('/')
    const cheatsheetHref = await page.locator('[data-testid="nav-cheatsheet"]').getAttribute('href')
    const examplesHref = await page.locator('[data-testid="nav-examples"]').getAttribute('href')
    const howtoHref = await page.locator('[data-testid="nav-how-to"]').getAttribute('href')
    expect(cheatsheetHref).toBe('/markdown-cheatsheet')
    expect(examplesHref).toBe('/examples')
    expect(howtoHref).toBe('/how-to-convert-markdown-to-pdf')
  })

  test('clicking header logo from a subpage navigates home', async ({ page }) => {
    await page.goto('/privacy')
    await page.locator('[data-testid="site-header-home"]').click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1').first()).toContainText('Markdown to PDF Converter')
  })

  test('mobile viewport stacks nav below logo', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const logoBox = await page.locator('[data-testid="site-header-home"]').boundingBox()
    const navBox = await page.locator('[data-testid="site-header"] nav').boundingBox()
    expect(logoBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    // Nav row sits visually below the logo row on mobile (within a small overlap tolerance)
    expect(navBox!.y).toBeGreaterThan(logoBox!.y + logoBox!.height - 8)
  })

  test('desktop viewport places nav inline with logo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const logoBox = await page.locator('[data-testid="site-header-home"]').boundingBox()
    const navBox = await page.locator('[data-testid="site-header"] nav').boundingBox()
    expect(logoBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    // Logo and nav share a row on desktop: vertical centers within 12 px of each other
    const logoCenter = logoBox!.y + logoBox!.height / 2
    const navCenter = navBox!.y + navBox!.height / 2
    expect(Math.abs(logoCenter - navCenter)).toBeLessThan(12)
  })
})
