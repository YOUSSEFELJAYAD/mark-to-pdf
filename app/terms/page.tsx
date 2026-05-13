import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for marktopdf.com. Free as-is, no warranty.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Terms</span>
      </nav>

      <h1 className="mt-6 text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 13 May 2026</p>

      <h2 className="mt-8 text-xl font-semibold">Acceptance</h2>
      <p>By using marktopdf.com you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.</p>

      <h2 className="mt-6 text-xl font-semibold">The service</h2>
      <p>
        marktopdf.com is a free online tool that converts Markdown to PDF and DOCX in your browser. It is provided
        as-is, without warranty of any kind. We do not guarantee that the converter will produce output suitable for
        any particular purpose or that conversion will be free of errors.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Acceptable use</h2>
      <p>
        Don&apos;t use the converter to produce content that violates applicable laws. Don&apos;t attempt to abuse,
        attack, or reverse-engineer the service in ways that interfere with its availability for other users.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Your content</h2>
      <p>
        We don&apos;t see your content — it stays in your browser. You retain all rights to anything you write or
        upload.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, marktopdf.com and its operators are not liable for any indirect,
        incidental, or consequential damages arising from use of the service.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Changes</h2>
      <p>We may update these terms at any time. Continued use after changes constitutes acceptance.</p>

      <p className="mt-12">
        <Link href="/" className="underline">← Back to the converter</Link>
      </p>
    </main>
  )
}
