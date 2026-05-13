import { safeJsonLd } from "@/lib/seo/json-ld"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://marktopdf.com"

const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Markdown to PDF Converter",
  description:
    "Free online Markdown to PDF and DOCX converter with live preview, syntax highlighting, autosave, and customizable export settings.",
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  applicationSubCategory: "Document Converter",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript. Modern browser (Chrome, Firefox, Safari, Edge).",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Convert Markdown to PDF",
    "Convert Markdown to DOCX",
    "Live syntax-highlighted editor with CodeMirror",
    "Drag-and-drop file upload",
    "Multiple themes (GitHub, Academic, Minimal)",
    "Customizable page size, margins, fonts",
    "Table of contents generation",
    "Cover page and page numbers",
    "Autosave to browser storage",
    "No signup required, fully client-side",
  ],
}

export function SoftwareAppJsonLd() {
  return (
    <script type="application/ld+json">{safeJsonLd(SOFTWARE_APP_JSONLD)}</script>
  )
}
