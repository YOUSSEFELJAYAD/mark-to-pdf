import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How marktopdf.com handles your data. Short version: your Markdown stays in your browser; we don't collect personal data.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Privacy</span>
      </nav>

      <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 13 May 2026</p>

      <h2 className="mt-8 text-xl font-semibold">Short version</h2>
      <p>
        marktopdf.com runs entirely in your browser. Your Markdown documents are never uploaded to any server.
        Conversion to PDF and DOCX happens client-side using JavaScript.
      </p>

      <h2 className="mt-6 text-xl font-semibold">What we do collect</h2>
      <p>
        We use Google Analytics to count visitors and understand which features are used. Google Analytics sets cookies
        and records anonymized data — see{" "}
        <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener">
          Google&apos;s privacy policy
        </a>{" "}
        for details.
      </p>
      <p>
        We display ads via Google AdSense. AdSense may use cookies to personalize ads. See{" "}
        <a className="underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">
          how Google uses ad data
        </a>.
      </p>

      <h2 className="mt-6 text-xl font-semibold">What we don&apos;t collect</h2>
      <ul>
        <li>Your Markdown content</li>
        <li>Your exported files</li>
        <li>Your email, name, or account information (we don&apos;t have accounts)</li>
        <li>Your IP address (beyond standard server logs from our host)</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">Local storage</h2>
      <p>
        The converter uses your browser&apos;s localStorage to autosave your current document, remember your recent
        documents, and persist your export preferences. This data lives only on your device and you can clear it any
        time via your browser&apos;s site data settings.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Contact</h2>
      <p>
        Questions? <Link href="/contact" className="underline">Contact us</Link>.
      </p>

      <p className="mt-12">
        <Link href="/" className="underline">← Back to the converter</Link>
      </p>
    </main>
  )
}
