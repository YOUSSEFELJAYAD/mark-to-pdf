import { safeJsonLd } from "@/lib/seo/json-ld"

const FAQ = [
  {
    q: "Is the Markdown to PDF converter really free?",
    a: "Yes. No signup, no watermark, no per-document fee. The site is supported by ads and runs entirely in your browser.",
  },
  {
    q: "Do my documents leave my browser?",
    a: "No. Conversion happens fully client-side in your browser. Your Markdown is never uploaded to any server.",
  },
  {
    q: "Which Markdown features are supported?",
    a: "Headings, bold, italic, strikethrough, lists, tables, blockquotes, code blocks with syntax highlighting, links, images, and horizontal rules. The converter uses GitHub-Flavored Markdown.",
  },
  {
    q: "Can I convert Markdown to Microsoft Word (DOCX)?",
    a: "Yes. Choose DOCX in the format selector before clicking Export. The output is a real .docx file compatible with Word, LibreOffice, and Google Docs.",
  },
  {
    q: "Can I customize the PDF output?",
    a: "Yes. Click the gear icon in the toolbar to choose page size (A4, Letter, Legal), margins, theme (GitHub, Academic, Minimal), fonts, table of contents, cover page, and page numbers.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The editor and preview are responsive. On phones, you toggle between editor and preview; on tablets and desktops, they appear side by side.",
  },
]

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
}

export function FaqJsonLd() {
  return <script type="application/ld+json">{safeJsonLd(FAQ_JSONLD)}</script>
}

export function FaqVisible() {
  return (
    <section className="border-t bg-muted/30" aria-labelledby="faq-heading">
      <div className="container mx-auto px-4 py-8">
        <h2 id="faq-heading" className="text-xl font-semibold mb-4">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-4 text-sm">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-foreground">{item.q}</dt>
              <dd className="mt-1 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
