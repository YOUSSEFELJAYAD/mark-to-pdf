# SEO Overhaul — Phases 3, 4, 5 (continuation)

**Parent plan:** `2026-05-13-seo-overhaul.md`
**Prerequisites:** Phase 0, 1, 2 complete.

---

# Phase 3 — Content pages

### Task 3.1: Examples library

**Files:**
- Create: `lib/seo/examples.ts`

This file is consumed by both `/examples` and `app/page.tsx` (for the `?example=` query-param hand-off).

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/seo/examples.ts`:

```ts
export interface MarkdownExample {
  slug: string
  title: string
  description: string
  markdown: string
}

export const EXAMPLES: MarkdownExample[] = [
  {
    slug: "resume",
    title: "Resume",
    description: "A clean one-page developer resume in Markdown.",
    markdown: `# Jane Doe

Full-Stack Developer · jane@example.com · github.com/janedoe

## Summary

Seven years building scalable web applications in TypeScript and Go. Comfortable owning a feature from design through production. Bias toward simple, well-tested code.

## Experience

### Senior Engineer, Acme Corp · 2022–present
- Led the rewrite of the billing pipeline (4× throughput, half the bugs).
- Mentored two junior engineers.

### Engineer, Beta Inc · 2018–2022
- Built the analytics dashboard used by 50+ customers.
- Owned the on-call rotation for the data ingestion service.

## Skills

TypeScript · React · Go · PostgreSQL · Docker · AWS

## Education

BSc Computer Science, State University · 2018
`,
  },
  {
    slug: "readme",
    title: "Project README",
    description: "A typical open-source project README with installation, usage, and license sections.",
    markdown: `# Project Name

> A short, punchy description of what this project does.

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Usage

\`\`\`ts
import { doTheThing } from 'project-name'

doTheThing('hello')
\`\`\`

## Features

- Zero configuration
- Tiny bundle (3 KB gzipped)
- Strict TypeScript types

## Contributing

Pull requests welcome. For major changes, open an issue first to discuss what you'd like to change.

## License

MIT
`,
  },
  {
    slug: "spec",
    title: "Technical Spec",
    description: "A short engineering design doc template.",
    markdown: `# Project Phoenix: Migrate auth to OAuth2

## Goal

Replace our legacy session-cookie auth with OAuth2 to support third-party integrations and improve security posture.

## Non-goals

- Rewriting the user-facing login UI
- Migrating existing sessions (we'll let them expire naturally)

## Approach

1. Stand up an OAuth2 provider (Hydra) in staging
2. Add a parallel /oauth/authorize flow next to the existing /login
3. Migrate API clients one at a time
4. Sunset /login after 90 days

## Risks

- **Token leakage** — mitigated by short-lived access tokens + rotating refresh tokens
- **Latency** — adds one network hop; benchmarked at ~30ms p95

## Timeline

| Week | Milestone |
|------|-----------|
| 1    | Hydra deployed to staging |
| 2    | /oauth/authorize live behind feature flag |
| 3–6  | Migrate clients |
| 10   | Sunset /login |
`,
  },
  {
    slug: "notes",
    title: "Meeting Notes",
    description: "A simple meeting notes template with attendees, decisions, and action items.",
    markdown: `# Weekly Sync — 2026-05-13

**Attendees:** Alice, Bob, Carol, Dave

## Updates

- **Alice** finished the migration script; ready for review.
- **Bob** is blocked on a permissions issue with the staging cluster.
- **Carol** demoed the new dashboard — sign-off pending.

## Decisions

- We'll ship the migration on Friday instead of Wednesday to give QA more time.
- The dashboard goes to GA in two weeks.

## Action Items

- [ ] **Alice** — open a PR for the migration script (today)
- [ ] **Bob** — file a ticket with infra (today)
- [ ] **Carol** — collect sign-off from product (by EOW)
- [ ] **Dave** — schedule the GA launch announcement (next sync)

## Next Meeting

2026-05-20, same time.
`,
  },
]

export function getExampleBySlug(slug: string): MarkdownExample | null {
  return EXAMPLES.find((e) => e.slug === slug) ?? null
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/seo/examples.ts
git commit -m "feat(seo): add markdown examples library"
```

### Task 3.2: `/examples` page

**Files:**
- Create: `app/examples/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/examples/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/examples/page.tsx
git commit -m "feat(seo): add /examples page"
```

### Task 3.3: `/markdown-cheatsheet` page

**Files:**
- Create: `app/markdown-cheatsheet/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/markdown-cheatsheet/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/markdown-cheatsheet/page.tsx
git commit -m "feat(seo): add /markdown-cheatsheet reference page"
```

### Task 3.4: `/how-to-convert-markdown-to-pdf` page

**Files:**
- Create: `app/how-to-convert-markdown-to-pdf/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/how-to-convert-markdown-to-pdf/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/how-to-convert-markdown-to-pdf/page.tsx
git commit -m "feat(seo): add /how-to-convert-markdown-to-pdf landing page"
```

### Task 3.5: `/markdown-to-docx` page

**Files:**
- Create: `app/markdown-to-docx/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/markdown-to-docx/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/markdown-to-docx/page.tsx
git commit -m "feat(seo): add /markdown-to-docx landing page"
```

### Task 3.6: Wire `?example=` query-param hand-off

**Files:**
- Modify: `app/page.tsx` (read searchParams, pass prop)
- Modify: `components/markdown-converter.tsx` (accept `initialExample` prop)
- Modify: `hooks/use-document.ts` (export `SAMPLE_MARKDOWN`)

- [ ] **Step 1: Export SAMPLE_MARKDOWN from the hook**

In `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/hooks/use-document.ts`, change the constant declaration from `const SAMPLE_MARKDOWN = ...` to `export const SAMPLE_MARKDOWN = ...`.

- [ ] **Step 2: Update `app/page.tsx`**

Add import:

```tsx
import { getExampleBySlug } from "@/lib/seo/examples"
```

Change the function signature and pass the prop:

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ example?: string }>
}) {
  const { example } = await searchParams
  const initialExample = example ? getExampleBySlug(example) : null

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* … existing content unchanged … */}
      {/* Find the existing <MarkdownConverter /> usage and update it: */}
      <MarkdownConverter initialExample={initialExample?.markdown ?? null} />
      {/* … rest unchanged */}
    </main>
  )
}
```

- [ ] **Step 3: Update `components/markdown-converter.tsx`**

Add to the file top:

```tsx
import { SAMPLE_MARKDOWN } from "@/hooks/use-document"
```

Add an interface (if there isn't one) and update the function signature:

```tsx
interface MarkdownConverterProps {
  initialExample?: string | null
}

export function MarkdownConverter({ initialExample = null }: MarkdownConverterProps) {
  // …existing body…
}
```

Inside the component, after the existing hook calls, add:

```tsx
  const exampleAppliedRef = React.useRef(false)
  React.useEffect(() => {
    if (exampleAppliedRef.current) return
    if (!initialExample) return
    if (markdown !== SAMPLE_MARKDOWN) return
    setMarkdown(initialExample)
    exampleAppliedRef.current = true
  }, [initialExample, markdown, setMarkdown])
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
```

Expected: 50/50 pass (no existing test exercises `?example=`).

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```

Open `http://localhost:3000/?example=resume` in an incognito window. The editor should load the resume example. Kill dev.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/markdown-converter.tsx hooks/use-document.ts
git commit -m "feat(seo): support ?example= query-param to load templates from /examples"
```

### Task 3.7: Add content-pages e2e test

**Files:**
- Create: `e2e/content-pages.spec.ts`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/content-pages.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const PAGES = [
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Service' },
  { path: '/contact', heading: 'Contact' },
  { path: '/how-to-convert-markdown-to-pdf', heading: 'How to Convert Markdown to PDF' },
  { path: '/markdown-to-docx', heading: 'Markdown to DOCX Converter' },
  { path: '/markdown-cheatsheet', heading: 'Markdown Cheatsheet' },
  { path: '/examples', heading: 'Markdown Examples' },
]

test.describe('Content pages', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders with H1 containing "${heading}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('h1').first()).toContainText(heading)
      await expect(
        page.getByRole('link', { name: /Home|Back to the converter|Open the converter|Try the converter/i }).first(),
      ).toBeVisible()
    })
  }

  test('Examples page has Try in editor links pointing to /?example=', async ({ page }) => {
    await page.goto('/examples')
    const tryLinks = page.getByRole('link', { name: /Try in editor/i })
    await expect(tryLinks.first()).toBeVisible()
    const href = await tryLinks.first().getAttribute('href')
    expect(href).toMatch(/^\/\?example=/)
  })

  test('Example query-param loads example into editor when sample is unchanged', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())

    await page.goto('/?example=resume')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('Jane Doe')
  })
})
```

- [ ] **Step 2: Run + commit**

```bash
npx playwright test e2e/content-pages.spec.ts --project=chromium
git add e2e/content-pages.spec.ts
git commit -m "test(seo): cover content pages render + example query-param hand-off"
```

### Task 3.8: Phase 3 verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all pass. Manual: visit each new page in dev. No commit.

---

# Phase 4 — Performance

### Task 4.1: Lazy-load jspdf + docx in handleExport

**Files:**
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Apply edit**

In `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/markdown-converter.tsx`:

Remove these two imports from the top of the file:

```tsx
import { exportHtmlToPdf } from "@/lib/export/export-pdf"
import { exportToDocx } from "@/lib/export/export-docx"
```

In `handleExport`, replace the `if (format === "pdf") { ... } else { ... }` block with lazy imports:

```tsx
      if (format === "pdf") {
        const { exportHtmlToPdf } = await import("@/lib/export/export-pdf")
        await exportHtmlToPdf(html, fullName, exportSettings)
      } else {
        const { exportToDocx } = await import("@/lib/export/export-docx")
        await exportToDocx(markdown, fullName, exportSettings)
      }
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
npm run build
```

Expected: existing export tests still pass. Build output's "First Load JS" for `/` should drop (verify in build output before committing).

```bash
git add components/markdown-converter.tsx
git commit -m "perf(seo): lazy-load jspdf and docx libraries on first export click"
```

### Task 4.2: Move Google Analytics to next/script

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the two raw GA `<script>` tags**

Find the two raw `<script>` tags in `<head>` of `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/layout.tsx`:
1. The async loader: `<script async src="https://www.googletagmanager.com/gtag/js?id=G-Y19V5P0PN7"></script>`
2. The inline gtag initializer that uses the React HTML-injection prop

Delete BOTH. Inside `<body>` (next to where the AdSense `<Script ... />` already is), insert these two `<Script>` components from `next/script`:

```tsx
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y19V5P0PN7"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-Y19V5P0PN7');`}
        </Script>
```

`Script` is already imported in `layout.tsx` (the existing AdSense block uses it).

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
git add app/layout.tsx
git commit -m "perf(seo): defer Google Analytics via next/script"
```

### Task 4.3: Preconnect to ad and analytics origins

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add preconnect links**

Inside `<head>` of `app/layout.tsx`, add:

```tsx
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/layout.tsx
git commit -m "perf(seo): preconnect to ad and analytics origins"
```

### Task 4.4: Dynamic-import CodeMirror in MarkdownConverter

**Files:**
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Replace the static MarkdownEditor import**

In `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/markdown-converter.tsx`:

Remove:

```tsx
import { MarkdownEditor, type EditorHandle } from "@/components/editor/markdown-editor"
```

Replace with:

```tsx
import dynamic from "next/dynamic"
import type { EditorHandle } from "@/components/editor/markdown-editor"
export type { EditorHandle }

const MarkdownEditor = dynamic(
  () => import("@/components/editor/markdown-editor").then((m) => m.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
)
```

> `ssr: false` is allowed here because `MarkdownConverter` itself has `"use client"`.

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
```

Expected: existing tests still pass. The editor mounts slightly later but tests wait for `.cm-content` to be visible. If any test times out, bump its waitFor; document in commit message if so.

```bash
git add components/markdown-converter.tsx
git commit -m "perf(seo): dynamic-import CodeMirror editor (out of SSR + initial chunk)"
```

### Task 4.5: Phase 4 verification

- [ ] **Step 1: Build size compare**

Optional — for confidence in the perf claim:

```bash
git stash
npm run build 2>&1 | grep -A 20 "Route (app)"   # baseline sizes (Phase 3 end)
git stash pop
npm run build 2>&1 | grep -A 20 "Route (app)"   # Phase 4 end sizes
```

Expected: smaller "First Load JS" for `/`.

- [ ] **Step 2: Full check**

```bash
npm run lint
npx tsc --noEmit
npm run test:chromium
```

Expected: all pass. No commit.

---

# Phase 5 — SEO tests + Lighthouse polish

### Task 5.1: e2e — metadata presence on every page

**Files:**
- Create: `e2e/seo-metadata.spec.ts`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/seo-metadata.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const PAGES = [
  { path: '/', titleContains: 'Markdown to PDF' },
  { path: '/privacy', titleContains: 'Privacy' },
  { path: '/terms', titleContains: 'Terms' },
  { path: '/contact', titleContains: 'Contact' },
  { path: '/how-to-convert-markdown-to-pdf', titleContains: 'How to Convert Markdown to PDF' },
  { path: '/markdown-to-docx', titleContains: 'Markdown to DOCX' },
  { path: '/markdown-cheatsheet', titleContains: 'Cheatsheet' },
  { path: '/examples', titleContains: 'Examples' },
]

test.describe('SEO metadata', () => {
  for (const { path, titleContains } of PAGES) {
    test(`${path} has title containing "${titleContains}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(new RegExp(titleContains, 'i'))
    })

    test(`${path} has a non-empty meta description`, async ({ page }) => {
      await page.goto(path)
      const desc = await page.locator('meta[name="description"]').getAttribute('content')
      expect(desc).toBeTruthy()
      expect(desc!.length).toBeGreaterThan(50)
      expect(desc!.length).toBeLessThan(170)
    })

    test(`${path} has a canonical URL`, async ({ page }) => {
      await page.goto(path)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toContain('marktopdf.com')
    })

    test(`${path} declares an OpenGraph image`, async ({ page }) => {
      await page.goto(path)
      const og = await page.locator('meta[property="og:image"]').first().getAttribute('content')
      expect(og).toBeTruthy()
    })
  }
})
```

- [ ] **Step 2: Run + commit**

```bash
npx playwright test e2e/seo-metadata.spec.ts --project=chromium
git add e2e/seo-metadata.spec.ts
git commit -m "test(seo): metadata presence on every page"
```

### Task 5.2: e2e — structured data shape

**Files:**
- Create: `e2e/seo-structured-data.spec.ts`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/seo-structured-data.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

async function getJsonLdTypes(page: import('@playwright/test').Page, path: string): Promise<string[]> {
  await page.goto(path)
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types: string[] = []
  for (const raw of scripts) {
    const decoded = raw.replace(/\\u003c/g, '<')
    let data: unknown
    try {
      data = JSON.parse(decoded)
    } catch {
      throw new Error(`Invalid JSON-LD on ${path}: ${raw.slice(0, 80)}…`)
    }
    if (Array.isArray(data)) {
      for (const d of data) if ((d as { '@type'?: string })['@type']) types.push((d as { '@type': string })['@type'])
    } else if (data && typeof data === 'object' && '@type' in data) {
      types.push((data as { '@type': string })['@type'])
    }
  }
  return types
}

test.describe('Structured data', () => {
  test('home has SoftwareApplication + FAQPage + HowTo', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/')
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('FAQPage')
    expect(types).toContain('HowTo')
  })

  test('/privacy has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/privacy')
    expect(types).toContain('BreadcrumbList')
  })

  test('/how-to-convert-markdown-to-pdf has BreadcrumbList + HowTo', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/how-to-convert-markdown-to-pdf')
    expect(types).toContain('BreadcrumbList')
    expect(types).toContain('HowTo')
  })

  test('/markdown-cheatsheet has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/markdown-cheatsheet')
    expect(types).toContain('BreadcrumbList')
  })

  test('/examples has BreadcrumbList', async ({ page }) => {
    const types = await getJsonLdTypes(page, '/examples')
    expect(types).toContain('BreadcrumbList')
  })
})
```

- [ ] **Step 2: Run + commit**

```bash
npx playwright test e2e/seo-structured-data.spec.ts --project=chromium
git add e2e/seo-structured-data.spec.ts
git commit -m "test(seo): JSON-LD types present on every page"
```

### Task 5.3: e2e — sitemap and robots

**Files:**
- Create: `e2e/sitemap-robots.spec.ts`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/sitemap-robots.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Sitemap and robots', () => {
  test('GET /sitemap.xml returns 200 with all routes on marktopdf.com', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('marktopdf.com')
    expect(body).toContain('/how-to-convert-markdown-to-pdf')
    expect(body).toContain('/markdown-to-docx')
    expect(body).toContain('/markdown-cheatsheet')
    expect(body).toContain('/examples')
    expect(body).toContain('/privacy')
    expect(body).toContain('/terms')
    expect(body).toContain('/contact')
  })

  test('GET /robots.txt returns 200 with sitemap pointing to marktopdf.com', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('Sitemap:')
    expect(body).toContain('marktopdf.com')
    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Allow: /')
  })
})
```

- [ ] **Step 2: Run + commit**

```bash
npx playwright test e2e/sitemap-robots.spec.ts --project=chromium
git add e2e/sitemap-robots.spec.ts
git commit -m "test(seo): sitemap and robots route handlers"
```

### Task 5.4: Lighthouse audit + fix any gaps

**Files:** various (driven by what Lighthouse flags)

- [ ] **Step 1: Run Lighthouse against the production build**

```bash
npm run build
npm run start &
SERVER_PID=$!
sleep 3
npx --yes lighthouse@latest http://localhost:3000 --only-categories=seo --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-home.json
npx --yes lighthouse@latest http://localhost:3000/markdown-cheatsheet --only-categories=seo --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-cheat.json
kill $SERVER_PID
```

- [ ] **Step 2: Read scores and failures**

```bash
node -e "const s=require('/tmp/lh-home.json'); console.log('Home SEO:', s.categories.seo.score*100); Object.values(s.audits).filter(a=>a.score!==null&&a.score<1&&s.categories.seo.auditRefs.some(r=>r.id===a.id)).forEach(a=>console.log('-', a.id, a.title))"
node -e "const s=require('/tmp/lh-cheat.json'); console.log('Cheat SEO:', s.categories.seo.score*100); Object.values(s.audits).filter(a=>a.score!==null&&a.score<1&&s.categories.seo.auditRefs.some(r=>r.id===a.id)).forEach(a=>console.log('-', a.id, a.title))"
```

Expected: SEO score 100 on both. Any audit below 1.0 needs a fix.

Common fixes (apply only what Lighthouse actually flags):

- `image-alt` — add `alt=""` to decorative images, descriptive alt to content images
- `link-text` — replace generic link text with descriptive text (none currently expected)
- `tap-targets` (mobile) — bump small icon button hit areas if needed
- `meta-description` length — adjust the page's `description` if too short/long
- `font-size` — verify body text ≥ 12px

- [ ] **Step 3: Apply fixes**

For each flagged audit, apply a targeted fix in the appropriate file. Commit per audit category. Re-run Lighthouse to confirm.

- [ ] **Step 4: Commit any fixes**

```bash
git add <fixed files>
git commit -m "fix(seo): Lighthouse SEO audit — <specific fix summary>"
```

If Lighthouse shows 100 on first run, no commit needed.

### Task 5.5: Validate JSON-LD with schema.org validator

Manual step.

- [ ] **Step 1: Validate each schema**

```bash
npm run dev
```

For each route (`/`, `/privacy`, `/terms`, `/contact`, `/how-to-convert-markdown-to-pdf`, `/markdown-to-docx`, `/markdown-cheatsheet`, `/examples`), open the page in a browser, view source, and copy every JSON-LD block into `https://validator.schema.org/`. Confirm zero errors per block. Warnings are acceptable when documented in the spec risks (e.g., missing `aggregateRating` on SoftwareApplication).

- [ ] **Step 2: Optionally test rich results after deploy**

After merge + push + deploy, paste live URLs into `https://search.google.com/test/rich-results`. Note warnings.

No commit.

### Task 5.6: Final verification

- [ ] **Step 1: All checks**

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
npx playwright test --project=firefox --project=webkit
npm run test:mobile
```

Expected: 0 errors, build success, e2e green (or only the pre-existing flakes documented in previous overhaul).

- [ ] **Step 2: Show final state**

```bash
git log --oneline main..HEAD | wc -l
git diff --stat main..HEAD | tail -3
```

Report counts. No commit.

---

## Post-merge manual follow-up (out of scope for this plan)

1. Submit `https://marktopdf.com/sitemap.xml` to Google Search Console.
2. Request indexing for the 8 URLs via Search Console URL inspection.
3. If `markdowntopdf.com` is a parked alias, set up a 301 redirect to `marktopdf.com`.
4. Paste the live home URL into Twitter / LinkedIn debuggers to verify the dynamic OG image renders.

---

## Risks recap

Carried from spec:

- SoftwareApplication eligibility limited without `aggregateRating` (we refuse to fake)
- HowTo rich results globally removed by Google Sept 2023 (schema kept as metadata only)
- FAQPage rich results downgraded (still worth doing)
- Dynamic OG image ~50ms cold on Edge runtime
- Lazy-loaded export libs add ~50–200ms on first export click (masked by "Generating…" label)
- AdSense + future CSP coordination
- Manifest icon URLs verified manually in Phase 1
