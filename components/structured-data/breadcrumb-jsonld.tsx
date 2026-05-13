import { safeJsonLd } from "@/lib/seo/json-ld"

interface BreadcrumbItem {
  name: string
  href: string
}

interface Props {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marktopdf.com"
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  }
  return <script type="application/ld+json">{safeJsonLd(data)}</script>
}
