import { test, expect } from '@playwright/test'

async function getJsonLdTypes(page: import('@playwright/test').Page, path: string): Promise<string[]> {
  await page.goto(path)
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types: string[] = []
  for (const raw of scripts) {
    const decoded = raw.replace(/\\u003c/g, '<')
    let data: unknown
    try {
      data = JSON.parse(decoded)
    } catch {
      throw new Error(`Invalid JSON-LD on ${path}: ${raw.slice(0, 80)}…`)
    }
    if (Array.isArray(data)) {
      for (const d of data) if ((d as { '@type'?: string })['@type']) types.push((d as { '@type': string })['@type'])
    } else if (data && typeof data === 'object' && '@type' in data) {
      types.push((data as { '@type': string })['@type'])
    }
  }
  return types
}

test.describe('Structured data', () => {
  test('home has SoftwareApplication + FAQPage + HowTo', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/')
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('FAQPage')
    expect(types).toContain('HowTo')
  })

  test('/privacy has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/privacy')
    expect(types).toContain('BreadcrumbList')
  })

  test('/how-to-convert-markdown-to-pdf has BreadcrumbList + HowTo', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/how-to-convert-markdown-to-pdf')
    expect(types).toContain('BreadcrumbList')
    expect(types).toContain('HowTo')
  })

  test('/markdown-cheatsheet has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/markdown-cheatsheet')
    expect(types).toContain('BreadcrumbList')
  })

  test('/examples has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/examples')
    expect(types).toContain('BreadcrumbList')
  })
})
