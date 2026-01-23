import { test, expect } from '@playwright/test'

test.describe('Markdown Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Page Load', () => {
    test('should display the main heading', async ({ page }) => {
      await expect(page.locator('header h1')).toContainText('Markdown Converter')
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
      const editor = page.locator('textarea')
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
      const editor = page.locator('textarea')

      // Clear and type new content
      await editor.clear()
      await editor.fill('# Test Heading\n\nThis is a test paragraph.')

      if (isMobile) {
        // Switch to preview mode on mobile
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('h1')).toContainText('Test Heading')
      await expect(preview.getByText('This is a test paragraph.')).toBeVisible()
    })

    test('should render bold text correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('This is **bold** text.')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('strong')).toContainText('bold')
    })

    test('should render italic text correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('This is *italic* text.')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('em')).toContainText('italic')
    })

    test('should render code blocks correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('```javascript\nconst x = 1;\n```')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('pre code')).toBeVisible()
    })

    test('should render lists correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('- Item 1\n- Item 2\n- Item 3')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('ul li')).toHaveCount(3)
    })

    test('should render blockquotes correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('> This is a quote')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      await expect(preview.locator('blockquote')).toContainText('This is a quote')
    })

    test('should render links correctly', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('[Click here](https://example.com)')

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

  test.describe('View Mode Toggle (Mobile)', () => {
    test.skip(({ isMobile }) => !isMobile, 'Mobile only test')

    test('should toggle between edit and preview on mobile', async ({ page }) => {
      // Should start in edit mode
      await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).toBeVisible()

      // Click preview button
      await page.locator('button:has(svg.lucide-eye)').click()

      await expect(page.locator('[data-slot="card-title"]:has-text("Preview")')).toBeVisible()
      await expect(page.locator('[data-slot="card-title"]:has-text("Markdown Editor")')).not.toBeVisible()
    })
  })

  test.describe('Export Options', () => {
    test('should have filename input', async ({ page, isMobile }) => {
      if (isMobile) {
        // Open mobile menu
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      const filenameInput = page.getByPlaceholder('document')
      await expect(filenameInput.first()).toBeVisible()
    })

    test('should allow changing filename', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      const filenameInput = page.getByPlaceholder('document').first()
      await filenameInput.clear()
      await filenameInput.fill('my-document')
      await expect(filenameInput).toHaveValue('my-document')
    })

    test('should have format selector with PDF and DOCX options', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      // Click on the select trigger
      await page.locator('[data-slot="select-trigger"]').first().click()

      await expect(page.getByRole('option', { name: 'PDF' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'DOCX' })).toBeVisible()
    })

    test('should be able to select DOCX format', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      await page.locator('[data-slot="select-trigger"]').first().click()
      await page.getByRole('option', { name: 'DOCX' }).click()

      await expect(page.locator('[data-slot="select-trigger"]').first()).toContainText('DOCX')
    })

    test('should have export button', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      await expect(page.getByRole('button', { name: /Export/i }).first()).toBeVisible()
    })

    test('should disable export button when editor is empty', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()

      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      await expect(page.getByRole('button', { name: /Export/i }).first()).toBeDisabled()
    })
  })

  test.describe('Export Functionality', () => {
    test('should export PDF successfully', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.getByRole('button', { name: /Export/i }).first().click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    })

    test('should export DOCX successfully', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

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

    test('should use custom filename for export', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

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

    test('should show loading state during export', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      // Click export button
      await page.getByRole('button', { name: /Export/i }).first().click()

      // Should show exporting state briefly
      await expect(
        page.getByRole('button', { name: /Exporting/i }).or(page.getByRole('button', { name: /Downloaded/i }))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show success state after export', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

      // Wait for download
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /Export/i }).first().click()
      await downloadPromise

      // Should show success state
      await expect(page.getByRole('button', { name: /Downloaded/i })).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should show mobile menu button on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
        return
      }

      // Menu button should be visible
      await expect(page.locator('button:has(svg.lucide-menu)')).toBeVisible()
    })

    test('should toggle mobile menu', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
        return
      }

      // Open menu
      await page.locator('button:has(svg.lucide-menu)').click()

      // Should show export options
      await expect(page.getByRole('button', { name: /Export/i }).first()).toBeVisible()

      // Close menu
      await page.locator('button:has(svg.lucide-x)').click()
    })

    test('should hide tips section on small screens', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
        return
      }

      // Tips section should not be visible on mobile
      await expect(page.locator('kbd:has-text("**bold**")')).not.toBeVisible()
    })

    test('should show tips section on desktop', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
        return
      }

      // Tips section should be visible on desktop
      await expect(page.locator('kbd:has-text("**bold**")')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('header h1')
      await expect(h1).toHaveCount(1)
      await expect(h1).toContainText('Markdown Converter')
    })

    test('should have labeled form controls', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.locator('button:has(svg.lucide-menu)').click()
      }

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
      const editor = page.locator('textarea')
      await editor.clear()

      // Preview should be empty but not error
      const preview = page.locator('.prose')
      await expect(preview).toBeVisible()
    })

    test('should handle special characters in markdown', async ({ page, isMobile }) => {
      const editor = page.locator('textarea')
      await editor.clear()
      await editor.fill('# Test <script>alert("xss")</script>')

      if (isMobile) {
        await page.locator('button:has(svg.lucide-eye)').click()
      }

      const preview = page.locator('.prose')
      // Script tags should be rendered but not executed (marked escapes them)
      await expect(preview).toBeVisible()
    })
  })
})
