import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"
import { SiteFooter } from "@/components/seo/site-footer"

export const metadata: Metadata = {
  title: "Markdown to DOCX Converter — Word-Compatible Output",
  description:
    "Convert Markdown to Microsoft Word (.docx) for free. Compatible with Word, LibreOffice, and Google Docs. Runs in your browser — no upload required.",
  alternates: { canonical: "/markdown-to-docx" },
}

export default function MarkdownToDocxPage() {
  return (
    <>
      <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", href: "/" },
            { name: "Markdown to DOCX", href: "/markdown-to-docx" },
          ]}
        />

        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Markdown to DOCX</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold">Markdown to DOCX Converter (Word-Compatible)</h1>

        <p className="mt-4">
          Need to share Markdown content with someone who prefers Microsoft Word? Our free online converter produces a
          real <code>.docx</code> file — not a PDF renamed with a different extension — that opens cleanly in Word,
          LibreOffice, and Google Docs.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Why DOCX?</h2>
        <p>
          DOCX is still the lingua franca of office documents. If you&apos;re submitting a paper, sharing a draft with
          a non-technical collaborator, or sending an attachment that needs to be editable, DOCX is what they expect.
          PDF is great for the final read; DOCX is great for the editing round-trip.
        </p>

        <h2 className="mt-8 text-xl font-semibold">How to convert</h2>
        <ol>
          <li>Open <Link href="/" className="underline">marktopdf.com</Link>.</li>
          <li>Paste, type, or drop your Markdown into the editor.</li>
          <li>Switch the format selector from <strong>PDF</strong> to <strong>DOCX</strong>.</li>
          <li>Click <strong>Export</strong>. Your <code>.docx</code> downloads instantly.</li>
        </ol>

        <h2 className="mt-8 text-xl font-semibold">What converts cleanly</h2>
        <ul>
          <li>Headings (H1–H6) → Word heading styles</li>
          <li><strong>Bold</strong>, <em>italic</em>, <s>strikethrough</s> → native Word formatting</li>
          <li>Bulleted and numbered lists</li>
          <li>Tables with headers</li>
          <li>Blockquotes (rendered with a left border + italic)</li>
          <li>Code blocks (Courier New, gray shading)</li>
          <li>Hyperlinks (clickable in Word)</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Compatibility notes</h2>
        <ul>
          <li><strong>Microsoft Word 2016+:</strong> opens with all formatting preserved.</li>
          <li><strong>LibreOffice Writer:</strong> opens with all formatting preserved; some heading style variations.</li>
          <li><strong>Google Docs:</strong> upload to Drive and open with Google Docs — formatting transfers cleanly, including TOC.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Customization</h2>
        <p>
          Click the gear icon in the editor toolbar to set page size (A4 / Letter / Legal), margins, table of contents
          depth, and page numbers. Cover page is supported too — uses your first H1 as the title.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Privacy</h2>
        <p>
          Your document never leaves your browser. Conversion uses the{" "}
          <a className="underline" href="https://docx.js.org/" target="_blank" rel="noopener">docx.js library</a>{" "}
          running entirely client-side.
        </p>

        <p className="mt-12 text-center">
          <Link href="/" className="underline">→ Try the converter</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
