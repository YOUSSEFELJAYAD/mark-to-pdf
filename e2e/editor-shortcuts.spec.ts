import { test, expect } from '@playwright/test'

test.describe('Editor keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
  })

  test('Cmd/Ctrl+B wraps selection in **', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('ControlOrMeta+B')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('**hello**')
  })

  test('Cmd/Ctrl+I wraps selection in *', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('ControlOrMeta+I')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('*hello*')
  })

  test('Alt+1 prefixes line with # ', async ({ page }) => {
    await page.keyboard.type('My heading')
    await page.keyboard.press('Alt+1')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('# My heading')
  })

  test('Cmd/Ctrl+Shift+. prefixes line with > ', async ({ page }) => {
    await page.keyboard.type('My quote')
    await page.keyboard.press('ControlOrMeta+Shift+Period')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('> My quote')
  })
})

test.describe('Editor toolbar buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
  })

  test('bold button wraps selection in **', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.locator('[data-testid="tb-bold"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('**hello**')
  })

  test('H2 button prefixes line with ## ', async ({ page }) => {
    await page.keyboard.type('My H2')
    await page.locator('[data-testid="tb-h2"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('## My H2')
  })

  test('unordered list button prefixes with - ', async ({ page }) => {
    await page.keyboard.type('item one')
    await page.locator('[data-testid="tb-ul"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('- item one')
  })
})
