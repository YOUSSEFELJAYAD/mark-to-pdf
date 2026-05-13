import { test, expect } from '@playwright/test'

test.describe('Recent documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('loading a file pushes the current doc to recents', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# First document')

    await page.locator('[data-testid="tb-upload"]').click()
    const fileInput = page.locator('input[type="file"][data-testid="hidden-file-input"]')
    await fileInput.setInputFiles({
      name: 'second.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Second document'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()

    await page.locator('[data-testid="tb-recents"]').click()
    await expect(page.getByText('First document', { exact: true })).toBeVisible()
  })

  test('clear all empties recents', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# Doc A')

    await page.locator('[data-testid="tb-upload"]').click()
    await page.locator('input[type="file"][data-testid="hidden-file-input"]').setInputFiles({
      name: 'b.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Doc B'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()

    await page.locator('[data-testid="tb-recents"]').click()
    await expect(page.getByText('Doc A', { exact: true })).toBeVisible()

    await page.locator('[data-testid="clear-recents"]').click()
    await expect(page.getByText('Doc A', { exact: true })).toBeHidden()
    // Radix restores focus to the trigger after onSelect closes the menu;
    // press Enter on the focused trigger to re-open instead of an immediate click.
    await page.keyboard.press('Enter')
    await expect(page.locator('text=None yet')).toBeVisible()
  })
})
