import { test, expect } from '@playwright/test'

test.describe('Autosave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('persists document to localStorage and restores on reload', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')

    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# My persistent doc')

    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saved', { timeout: 4000 })

    await page.reload()

    await expect(editor).toContainText('My persistent doc')
  })

  test('shows "Saving…" then "Saved" status indicator', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')

    await editor.click()
    await page.keyboard.type(' extra')

    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saving…')
    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saved', { timeout: 4000 })
  })

  test('shows word count and character count', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('one two three')

    await expect(page.locator('[data-testid="word-count"]')).toContainText('Words: 3')
    await expect(page.locator('[data-testid="char-count"]')).toContainText('Chars: 13')
  })
})
