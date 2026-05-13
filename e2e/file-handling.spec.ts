import { test, expect } from '@playwright/test'

test.describe('File handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('upload .md file loads contents into editor (after confirm)', async ({ page }) => {
    await page.locator('[data-testid="tb-upload"]').click()
    const fileInput = page.locator('input[type="file"][data-testid="hidden-file-input"]')
    await fileInput.setInputFiles({
      name: 'sample.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Uploaded heading\n\nUploaded body.'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('Uploaded heading')
  })

  test('filename updates from H1 when not user-edited', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# My Lovely Document\n\nBody.')
    await expect(page.locator('#filename')).toHaveValue('my-lovely-document')
  })

  test('filename does NOT update from H1 after user edits filename', async ({ page }) => {
    const filenameInput = page.locator('#filename')
    await filenameInput.fill('user-chosen')

    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# Different heading')

    await expect(filenameInput).toHaveValue('user-chosen')
  })
})
