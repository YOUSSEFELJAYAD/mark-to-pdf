import { test, expect } from '@playwright/test'

test.describe('Sitemap and robots', () => {
  test('GET /sitemap.xml returns 200 with all routes on marktopdf.com', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('marktopdf.com')
    expect(body).toContain('/how-to-convert-markdown-to-pdf')
    expect(body).toContain('/markdown-to-docx')
    expect(body).toContain('/markdown-cheatsheet')
    expect(body).toContain('/examples')
    expect(body).toContain('/privacy')
    expect(body).toContain('/terms')
    expect(body).toContain('/contact')
  })

  test('GET /robots.txt returns 200 with sitemap pointing to marktopdf.com', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('Sitemap:')
    expect(body).toContain('marktopdf.com')
    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Allow: /')
  })
})
