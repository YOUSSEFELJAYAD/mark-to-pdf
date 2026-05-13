import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"
import { SiteFooter } from "@/components/seo/site-footer"

export const metadata: Metadata = {
  title: "Markdown Cheatsheet — Complete Syntax Reference",
  description:
    "Complete Markdown syntax reference: headings, emphasis, lists, links, images, code, tables, blockquotes, and GitHub-Flavored Markdown extras. With live examples.",
  alternates: { canonical: "/markdown-cheatsheet" },
}

interface Row {
  description: string
  source: string
  rendered: React.ReactNode
}

const SECTIONS: { heading: string; rows: Row[] }[] = [
  {
    heading: "Headings",
    rows: [
      { description: "Top-level heading", source: "# Heading 1", rendered: <h1 className="text-2xl font-bold">Heading 1</h1> },
      { description: "Second-level", source: "## Heading 2", rendered: <h2 className="text-xl font-semibold">Heading 2</h2> },
      { description: "Third-level", source: "### Heading 3", rendered: <h3 className="text-lg font-semibold">Heading 3</h3> },
    ],
  },
  {
    heading: "Emphasis",
    rows: [
      { description: "Bold", source: "**bold text**", rendered: <strong>bold text</strong> },
      { description: "Italic", source: "*italic text*", rendered: <em>italic text</em> },
      { description: "Strikethrough", source: "~~struck~~", rendered: <s>struck</s> },
      { description: "Inline code", source: "`code`", rendered: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">code</code> },
    ],
  },
  {
    heading: "Lists",
    rows: [
      {
        description: "Unordered",
        source: "- item one\n- item two\n- item three",
        rendered: (
          <ul className="list-disc pl-6">
            <li>item one</li>
            <li>item two</li>
            <li>item three</li>
          </ul>
        ),
      },
      {
        description: "Ordered",
        source: "1. first\n2. second\n3. third",
        rendered: (
          <ol className="list-decimal pl-6">
            <li>first</li>
            <li>second</li>
            <li>third</li>
          </ol>
        ),
      },
    ],
  },
  {
    heading: "Links & Images",
    rows: [
      { description: "Link", source: "[link text](https://example.com)", rendered: <a className="underline" href="https://example.com">link text</a> },
      { description: "Image", source: "![alt text](image.png)", rendered: <span className="text-muted-foreground">[image renders here]</span> },
    ],
  },
  {
    heading: "Code",
    rows: [
      {
        description: "Fenced code block",
        source: "```ts\nconst x = 1\n```",
        rendered: (
          <pre className="rounded bg-muted p-2 text-xs">
            <code>const x = 1</code>
          </pre>
        ),
      },
    ],
  },
  {
    heading: "Quotes & Rules",
    rows: [
      {
        description: "Blockquote",
        source: "> quoted text",
        rendered: <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground">quoted text</blockquote>,
      },
      { description: "Horizontal rule", source: "---", rendered: <hr className="border-border" /> },
    ],
  },
  {
    heading: "Tables (GFM)",
    rows: [
      {
        description: "Pipe table",
        source: "| Col A | Col B |\n|-------|-------|\n| a1    | b1    |\n| a2    | b2    |",
        rendered: (
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Col A</th>
                <th className="border px-2 py-1">Col B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">a1</td>
                <td className="border px-2 py-1">b1</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">a2</td>
                <td className="border px-2 py-1">b2</td>
              </tr>
            </tbody>
          </table>
        ),
      },
    ],
  },
  {
    heading: "Escaping",
    rows: [
      { description: "Escape a special character", source: "\\*not italic\\*", rendered: <span>*not italic*</span> },
    ],
  },
]

export default function CheatsheetPage() {
  return (
    <>
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Cheatsheet", href: "/markdown-cheatsheet" }]} />

        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Cheatsheet</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold">Markdown Cheatsheet</h1>
        <p className="mt-4 text-muted-foreground">
          A complete syntax reference for Markdown and GitHub-Flavored Markdown (GFM). Every snippet below is supported
          by our{" "}
          <Link href="/" className="underline">free Markdown to PDF converter</Link>.
        </p>

        <div className="mt-10 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold border-b pb-2">{section.heading}</h2>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="text-sm text-muted-foreground">Markdown</div>
                <div className="text-sm text-muted-foreground">Rendered</div>
                {section.rows.map((row) => (
                  <React.Fragment key={row.source}>
                    <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-xs whitespace-pre-wrap">
                      {row.source}
                    </pre>
                    <div className="text-sm">{row.rendered}</div>
                  </React.Fragment>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-center">
          <Link href="/" className="underline">← Open the converter</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
