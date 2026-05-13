import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"
import { HowToJsonLd } from "@/components/structured-data/howto-jsonld"
import { SiteFooter } from "@/components/seo/site-footer"

export const metadata: Metadata = {
  title: "How to Convert Markdown to PDF (Free, Online, No Signup)",
  description:
    "Step-by-step guide to converting Markdown files to PDF for free. No signup, no install — runs in your browser. Customize page size, theme, and more.",
  alternates: { canonical: "/how-to-convert-markdown-to-pdf" },
}

export default function HowToPage() {
  return (
    <>
      <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", href: "/" },
            { name: "How to convert Markdown to PDF", href: "/how-to-convert-markdown-to-pdf" },
          ]}
        />
        <HowToJsonLd />

        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>How to convert Markdown to PDF</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold">How to Convert Markdown to PDF (Free, Online, No Signup)</h1>

        <p className="mt-4">
          Markdown is the lightweight markup language behind README files, technical specs, and most developer-facing
          docs. PDF is what you actually need to print, share, or attach to an email. This guide walks through the
          fastest way to convert one to the other — for free, with no signup, no install, and no document upload.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Quick answer</h2>
        <p>
          Open{" "}
          <Link href="/" className="underline">marktopdf.com</Link>, paste your Markdown into the editor, click{" "}
          <strong>Export</strong>. Done.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Step by step</h2>

        <h3 className="mt-4 text-lg font-semibold">1. Open the converter</h3>
        <p>
          Go to <Link href="/" className="underline">marktopdf.com</Link> in any modern browser. There&apos;s no signup
          form and no install. The converter loads in a few seconds.
        </p>

        <h3 className="mt-4 text-lg font-semibold">2. Add your Markdown</h3>
        <p>Three ways to get content into the editor:</p>
        <ul>
          <li><strong>Paste</strong> from your clipboard.</li>
          <li><strong>Type</strong> directly — syntax highlighting and live preview make it feel like a real editor.</li>
          <li><strong>Drag-and-drop</strong> a <code>.md</code>, <code>.markdown</code>, or <code>.txt</code> file onto the editor. Or click the upload icon in the toolbar.</li>
        </ul>

        <h3 className="mt-4 text-lg font-semibold">3. Tune the output (optional)</h3>
        <p>Click the gear icon in the toolbar to open the export settings. You can choose:</p>
        <ul>
          <li><strong>Page size:</strong> A4, Letter, or Legal</li>
          <li><strong>Margins:</strong> Narrow, Normal, or Wide</li>
          <li><strong>Theme:</strong> GitHub (default), Academic (serif), or Minimal</li>
          <li><strong>Fonts:</strong> Sans, Serif, or Mono for body and headings</li>
          <li><strong>Table of contents:</strong> off, H1–H2, or H1–H3</li>
          <li><strong>Page numbers:</strong> off, centered, or right-aligned in the footer</li>
          <li><strong>Cover page:</strong> use the first H1 as a title page</li>
        </ul>

        <h3 className="mt-4 text-lg font-semibold">4. Export</h3>
        <p>
          Pick <strong>PDF</strong> (or <strong>DOCX</strong>) in the format dropdown next to the Export button. Click{" "}
          <strong>Export</strong>. Your file downloads instantly. The converter keeps your document in your browser
          between sessions, so you can come back later and pick up where you left off.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Tips for clean output</h2>
        <ul>
          <li>Use proper heading hierarchy: one H1 (title), then H2 sections, then H3 subsections. The TOC and cover page features key off the H1.</li>
          <li>Tables work great. If yours look cramped, try Wide margins.</li>
          <li>Long code blocks: stick to ~80 characters per line. The PDF wraps long lines but it&apos;s less pretty.</li>
          <li>For academic papers, switch the theme to Academic — you get a serif body font and indented paragraphs.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Does it work on mobile?</h2>
        <p>
          Yes. On phones you toggle between editor and preview; on tablets and desktops they appear side by side.
          Export works the same way.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Privacy</h2>
        <p>
          Your document never leaves your browser. Conversion runs entirely client-side. See our{" "}
          <Link href="/privacy" className="underline">privacy policy</Link> for details.
        </p>

        <p className="mt-12 text-center">
          <Link href="/" className="underline">→ Open the converter</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
