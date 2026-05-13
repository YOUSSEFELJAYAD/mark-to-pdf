import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about marktopdf.com — bug reports, feature requests, or feedback.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} />
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Contact</span>
      </nav>

      <h1 className="mt-6 text-3xl font-bold">Contact</h1>
      <p className="mt-4">Found a bug? Have a feature request? Want to say hi?</p>

      <p className="mt-4">
        Email:{" "}
        <a className="underline" href="mailto:eljayadyoussef@gmail.com">
          eljayadyoussef@gmail.com
        </a>
      </p>

      <p className="mt-4">We read every message but can&apos;t always reply quickly. For bug reports, please include:</p>
      <ul>
        <li>What you were trying to do</li>
        <li>What you expected to happen</li>
        <li>What actually happened</li>
        <li>Browser + OS (e.g., Chrome 130 on macOS 14)</li>
      </ul>

      <p className="mt-12">
        <Link href="/" className="underline">← Back to the converter</Link>
      </p>
    </main>
  )
}
