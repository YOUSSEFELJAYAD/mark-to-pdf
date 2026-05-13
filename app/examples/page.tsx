import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"
import { EXAMPLES } from "@/lib/seo/examples"
import { SiteFooter } from "@/components/seo/site-footer"

export const metadata: Metadata = {
  title: "Markdown Examples & Templates",
  description:
    "Real-world Markdown examples — resume, project README, technical spec, meeting notes. Load any of them into the converter with one click.",
  alternates: { canonical: "/examples" },
}

export default function ExamplesPage() {
  return (
    <>
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", href: "/" },
            { name: "Examples", href: "/examples" },
          ]}
        />

        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Examples</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold">Markdown Examples & Templates</h1>
        <p className="mt-4 text-muted-foreground">
          Real-world Markdown documents you can convert to PDF or DOCX. Click <em>Try in editor</em> on any example to
          load it into the converter — your current document is preserved if you&apos;ve already started one.
        </p>

        <div className="mt-10 space-y-12">
          {EXAMPLES.map((ex) => (
            <article key={ex.slug} className="space-y-4">
              <header className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-semibold">{ex.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{ex.description}</p>
                </div>
                <Link
                  href={`/?example=${ex.slug}`}
                  className="text-sm font-medium underline hover:no-underline"
                >
                  Try in editor →
                </Link>
              </header>
              <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs whitespace-pre-wrap">
                {ex.markdown}
              </pre>
            </article>
          ))}
        </div>

        <p className="mt-16 text-center">
          <Link href="/" className="underline">← Back to the converter</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
