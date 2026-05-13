import { test, expect } from '@playwright/test'

test.describe('Markdown Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Page Load', () => {
    test('should display the main heading', async ({ page }) => {
      await expect(page.locator('[data-testid="page-h1"]')).toContainText('Markdown to PDF Converter')
    })

    test('should display editor and preview cards', async ({ page, isMobile }) => {
      // On mobile, only one panel is visible at a time
      if (isMobile) {
        await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).toBeVisible()
      } else {
        await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).toBeVisible()
        await expect(page.locator('[data-slot="card-title"]:has-text("Preview")')).toBeVisible()
      }
    })

    test('should load with sample markdown content', async ({ page }) => {
      const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
      await expect(editor).toContainText('Welcome to Markdown Converter')
    })

    test('should show preview of sample content', async ({ page, isMobile }) => {
      if (isMobile) {
        // Switch to preview mode on mobile
        await page.locator('button:has(svg.lucide-eye)').click()
      }
      const preview = page.locator('.prose')
      await expect(preview.locator('h1')).toContainText('Welcome to Markdown Converter')
    })
  })

  test.describe('Editor Functionality', () => {
    test('should update preview when editing markdown', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('# Test Heading\n\nThis is a test paragraph.')

      if (isMobile) {
        // Switch to preview mode on mobile
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('h1')).toContainText('Test Heading')
      await expect(preview.getByText('This is a test paragraph.')).toBeVisible()
    })

    test('should render bold text correctly', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('This is **bold** text.')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('strong')).toContainText('bold')
    })

    test('should render italic text correctly', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('This is *italic* text.')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('em')).toContainText('italic')
    })

    test('should render code blocks correctly', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('```javascript\nconst x = 1;\n```')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('pre code')).toBeVisible()
    })

    test('should render lists correctly', async ({ page, isMobile }) => {
      // Markdown extension auto-continues list markers after Enter, so just
      // type the marker once and let auto-continue add it for subsequent lines.
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('- Item 1')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Item 2')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Item 3')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('ul li')).toHaveCount(3)
    })

    test('should render blockquotes correctly', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('> This is a quote')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('blockquote')).toContainText('This is a quote')
    })

    test('should render links correctly', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('[Click here](https://example.com)')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      const link = preview.locator('a')
      await expect(link).toHaveText('Click here')
      await expect(link).toHaveAttribute('href', 'https://example.com')
    })
  })

  test.describe('View Mode Toggle (Desktop)', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop only test')

    test('should switch to edit-only mode', async ({ page }) => {
      await page.getByRole('button', { name: 'Edit' }).click()

      await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).toBeVisible()
      await expect(page.locator('[data-slot="card-title"]:has-text("Preview")')).not.toBeVisible()
    })

    test('should switch to preview-only mode', async ({ page }) => {
      await page.getByRole('button', { name: 'Preview' }).click()

      await expect(page.locator('[data-slot="card-title"]:has-text("Preview")')).toBeVisible()
      await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).not.toBeVisible()
    })

    test('should switch to split mode', async ({ page }) => {
      // First go to edit mode
      await page.getByRole('button', { name: 'Edit' }).click()
      // Then back to split
      await page.getByRole('button', { name: 'Split' }).click()

      await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).toBeVisible()
      await expect(page.locator('[data-slot="card-title"]:has-text("Preview")')).toBeVisible()
    })
  })

  test.describe('Export Options', () => {
    test('should have filename input', async ({ page }) => {
      const filenameInput = page.getByPlaceholder('document')
      await expect(filenameInput.first()).toBeVisible()
    })

    test('should allow changing filename', async ({ page }) => {
      const filenameInput = page.getByPlaceholder('document').first()
      await filenameInput.clear()
      await filenameInput.fill('my-document')
      await expect(filenameInput).toHaveValue('my-document')
    })

    test('should have format selector with PDF and DOCX options', async ({ page }) => {
      // Click on the select trigger
      await page.locator('[data-slot="select-trigger"]').first().click()

      await expect(page.getByRole('option', { name: 'PDF' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'DOCX' })).toBeVisible()
    })

    test('should be able to select DOCX format', async ({ page }) => {
      await page.locator('[data-slot="select-trigger"]').first().click()
      await page.getByRole('option', { name: 'DOCX' }).click()

      await expect(page.locator('[data-slot="select-trigger"]').first()).toContainText('DOCX')
    })

    test('should have export button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Export/i }).first()).toBeVisible()
    })

    test('should disable export button when editor is empty', async ({ page }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')

      await expect(page.getByRole('button', { name: /Export/i }).first()).toBeDisabled()
    })
  })

  test.describe('Export Functionality', () => {
    test('should export PDF successfully', async ({ page }) => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.getByRole('button', { name: /Export/i }).first().click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    })

    test('should export DOCX successfully', async ({ page }) => {
      // Select DOCX format
      await page.locator('[data-slot="select-trigger"]').first().click()
      await page.getByRole('option', { name: 'DOCX' }).click()

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.getByRole('button', { name: /Export/i }).first().click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.docx$/)
    })

    test('should use custom filename for export', async ({ page }) => {
      // Set custom filename
      const filenameInput = page.getByPlaceholder('document').first()
      await filenameInput.clear()
      await filenameInput.fill('my-custom-file')

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.getByRole('button', { name: /Export/i }).first().click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toBe('my-custom-file.pdf')
    })

    test('should show loading state during export', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).first().click()
      await expect(
        page.getByRole('button', { name: /Generating PDF/i }).or(page.locator('text=Downloaded').first())
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show success state after export', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /Export/i }).first().click()
      await downloadPromise
      await expect(page.locator('text=Downloaded').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('[data-testid="page-h1"]')
      await expect(h1).toHaveCount(1)
      await expect(h1).toContainText('Markdown to PDF Converter')
    })

    test('should have labeled form controls', async ({ page }) => {
      // Filename input should have label
      await expect(page.getByText('Filename').first()).toBeVisible()
    })

    test('should be keyboard navigable', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
        return
      }

      // Tab through the page
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should focus on interactive elements
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle empty content gracefully', async ({ page }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')

      // Preview area should still be present
      await expect(page.locator('[data-testid="markdown-preview"]')).toBeVisible()
    })

    test('should handle special characters in markdown', async ({ page, isMobile }) => {
      await page.locator('[data-testid="markdown-editor"] .cm-content').click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.press('Delete')
      await page.keyboard.type('# Test <script>alert("xss")</script>')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      // Script tags should be rendered but not executed (marked escapes them)
      await expect(preview).toBeVisible()
    })
  })
})
