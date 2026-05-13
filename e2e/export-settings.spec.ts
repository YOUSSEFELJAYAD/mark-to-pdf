import { test, expect } from '@playwright/test'

test.describe('Export settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('settings dialog opens and theme changes preview class', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await expect(page.locator('text=Export settings')).toBeVisible()

    await page.locator('[data-testid="opt-theme-academic"]').click()
    await page.getByRole('button', { name: 'Done' }).click()

    await expect(page.locator('[data-testid="markdown-preview"]')).toHaveClass(/prose-academic/)
  })

  test('settings persist across reload', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await page.locator('[data-testid="opt-pagesize-Letter"]').click()
    await page.getByRole('button', { name: 'Done' }).click()

    await page.reload()
    await page.locator('[data-testid="tb-settings"]').click()
    await expect(page.locator('[data-testid="opt-pagesize-Letter"]')).toHaveClass(/bg-secondary/)
  })

  test('reset restores defaults', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await page.locator('[data-testid="opt-theme-minimal"]').click()
    await page.locator('[data-testid="opt-reset"]').click()
    await expect(page.locator('[data-testid="opt-theme-github"]')).toHaveClass(/bg-secondary/)
  })
})
