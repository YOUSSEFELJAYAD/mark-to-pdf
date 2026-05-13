import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marktopdf.com'
  const now = new Date()

  return [
    { url: `${baseUrl}/`,                                 lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/how-to-convert-markdown-to-pdf`,   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/markdown-to-docx`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/markdown-cheatsheet`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/examples`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`,                          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,                            lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/contact`,                          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
