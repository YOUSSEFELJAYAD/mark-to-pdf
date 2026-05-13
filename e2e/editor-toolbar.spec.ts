import { test, expect } from '@playwright/test'

test.describe('CodeMirror editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('CodeMirror editor is present (no textarea)', async ({ page }) => {
    await expect(page.locator('[data-testid="markdown-editor"]')).toBeVisible()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-editor')).toBeVisible()
    await expect(page.locator('textarea')).toHaveCount(0)
  })

  test('toolbar is visible with bold button', async ({ page }) => {
    await expect(page.locator('[data-testid="editor-toolbar"]')).toBeVisible()
    await expect(page.locator('[data-testid="tb-bold"]')).toBeVisible()
  })
})
