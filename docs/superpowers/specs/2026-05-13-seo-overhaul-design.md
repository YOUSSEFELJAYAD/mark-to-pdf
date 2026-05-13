# SEO Overhaul — Design

**Date:** 2026-05-13
**Status:** Approved, pending implementation plan
**Target:** Lighthouse SEO 100/100, eligibility for FAQ + HowTo rich results, fix all broken SEO infrastructure.
**Live domain:** `marktopdf.com`

## Goal

Lift the site's SEO from "metadata wired but broken in places" to "production-grade SEO with rich-snippet eligibility, content depth, and Core Web Vitals headroom." Five phases:

1. Fix critical bugs (wrong domain in sitemap/robots, missing icon/OG assets, dead footer links)
2. Enrich structured data (SoftwareApplication, FAQPage, HowTo, BreadcrumbList)
3. Add 4 content pages targeting keyword clusters
4. Performance: lazy-load heavy export libs, optimize script loading
5. Polish to Lighthouse 100 + validate every schema

## Non-goals

- Multi-language i18n (English-only)
- A blog with MDX (deferred — content pages cover the SEO need without the engine)
- Search functionality on the site (no SearchAction schema needed)
- A11y overhaul beyond Lighthouse SEO basics (separate concern)
- Rewriting the converter UI from the previous overhaul

## Architecture

```
app/
  layout.tsx                          metadata + lifted scripts + scripts via next/script
  page.tsx                            home — H1 fix, footer Links, FAQ + HowTo schemas mounted
  opengraph-image.tsx                 (new) dynamic OG image via next/og
  twitter-image.tsx                   (new) dynamic Twitter image
  icon.tsx                            (new) dynamic icons (32, 192, 512) via generateImageMetadata
  apple-icon.tsx                      (new) dynamic apple-touch-icon (180×180)
  robots.ts                           (new — replaces public/robots.txt)
  sitemap.ts                          (modify — fix domain, add subpages)
  privacy/page.tsx                    (new)
  terms/page.tsx                      (new)
  contact/page.tsx                    (new)
  how-to-convert-markdown-to-pdf/page.tsx   (new)
  markdown-to-docx/page.tsx                  (new)
  markdown-cheatsheet/page.tsx               (new)
  examples/page.tsx                          (new)

components/
  structured-data/
    base-jsonld.tsx                   (new — SoftwareApplication for the homepage)
    faq-jsonld.tsx                    (new — FAQPage schema generator)
    howto-jsonld.tsx                  (new — HowTo schema generator)
    breadcrumb-jsonld.tsx             (new — BreadcrumbList generator)
  markdown-converter.tsx              (modify — lazy-load jspdf and docx via dynamic import)
  seo/
    site-footer.tsx                   (new — extracts and fixes the footer)

public/
  robots.txt                          DELETED (replaced by robots.ts route handler)
  manifest.json                       (modify — keep icon paths but they will be served by app/icon.tsx variants)
```

### Data flow

- All structured data is emitted via `<script type="application/ld+json">` in the page's component tree (server-rendered, no runtime cost).
- Each subpage exports its own `metadata` and adds its own `BreadcrumbList`.
- `robots.ts` reads `process.env.NEXT_PUBLIC_SITE_URL` and emits `Sitemap:` line pointing to the same source.
- `sitemap.ts` reads the same env var and lists all pages.

## Phase 1 — Bug fixes & infrastructure

### 1.1 Domain fix

- `sitemap.ts` and `robots.ts` use `process.env.NEXT_PUBLIC_SITE_URL || 'https://marktopdf.com'`. Delete `public/robots.txt`.

### 1.2 Dynamic OG / icons

Use Next.js file conventions:

- `app/opengraph-image.tsx` — exports `default async function Image()` returning `new ImageResponse(...)`. Size: 1200×630. Content: large title "Markdown → PDF", subtitle "Free online converter", site URL footer. Pure server-side at request time.
- `app/twitter-image.tsx` — same content, `summary_large_image` dims (also 1200×630, Twitter is fine with the OG dims).
- `app/icon.tsx` — uses `generateImageMetadata()` to emit three sizes (32×32, 192×192, 512×512) from a single file. Each variant is an `ImageResponse` with the monogram "M" on the brand color. Next.js exposes them at `/icon/0`, `/icon/1`, `/icon/2` (or with the `id` param specified). The `<link rel="icon">` tags are emitted automatically by Next.js based on the returned metadata; manifest also discovers them.
- `app/apple-icon.tsx` — 180×180, single `size` export (no generateImageMetadata needed for one size).

**Canonical pattern** (committed to in this spec — no further indecision):

```tsx
// app/icon.tsx
import { ImageResponse } from "next/og"

export function generateImageMetadata() {
  return [
    { id: "small",  size: { width: 32,  height: 32 },  contentType: "image/png" },
    { id: "medium", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "large",  size: { width: 512, height: 512 }, contentType: "image/png" },
  ]
}

export default function Icon({ id }: { id: string }) {
  const size = id === "small" ? 32 : id === "medium" ? 192 : 512
  return new ImageResponse(/* M monogram on brand bg, scaled to size */, { width: size, height: size })
}
```

Manifest references the medium and large variants by Next.js's route paths. Manifest JSON shape final:

```json
{
  "icons": [
    { "src": "/icon/medium", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon/large",  "sizes": "512x512", "type": "image/png" }
  ]
}
```

This satisfies both Lighthouse SEO and PWA installability checks.

Final asset set:

| File | Source | Sizes | Purpose |
|---|---|---|---|
| `app/opengraph-image.tsx` | dynamic ImageResponse | 1200×630 | OG cards |
| `app/twitter-image.tsx` | dynamic ImageResponse | 1200×630 | Twitter cards |
| `app/icon.tsx` | dynamic ImageResponse + generateImageMetadata | 32×32, 192×192, 512×512 | favicon + manifest |
| `app/apple-icon.tsx` | dynamic ImageResponse | 180×180 | apple-touch-icon |
| `public/favicon.ico` | existing | multi | fallback for legacy clients |

### 1.3 H1 fix

`app/page.tsx`: change `<h1>Markdown Converter</h1>` to `<h1>Markdown to PDF Converter</h1>`. Subtitle paragraph already says "Free online tool to convert Markdown to PDF or DOCX" — keep.

### 1.4 SoftwareApplication JSON-LD (replace WebApplication)

`components/structured-data/base-jsonld.tsx`:

```ts
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Markdown to PDF Converter",
  "description": "Free online Markdown to PDF and DOCX converter with live preview, syntax highlighting, autosave, and customizable export settings.",
  "url": "https://marktopdf.com",
  "applicationCategory": "UtilitiesApplication",
  "applicationSubCategory": "Document Converter",
  "operatingSystem": "Web Browser",
  "browserRequirements": "Requires JavaScript. Modern browser (Chrome, Firefox, Safari, Edge).",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": [
    "Convert Markdown to PDF",
    "Convert Markdown to DOCX",
    "Live syntax-highlighted editor with CodeMirror",
    "Drag-and-drop file upload",
    "Multiple themes (GitHub, Academic, Minimal)",
    "Customizable page size, margins, fonts",
    "Table of contents generation",
    "Cover page and page numbers",
    "Autosave to browser storage",
    "No signup required, fully client-side"
  ]
}
```

### 1.5 Legal pages

Three pages with minimal templated content. Each gets its own metadata block, canonical URL, and `BreadcrumbList`.

- `/privacy` — "We don't collect personal data. Everything runs client-side. Google Analytics + AdSense load standard cookies, see their policies." (~250 words)
- `/terms` — "Free, as-is, no warranty. Don't blame us if jsPDF mangles your obscure markdown edge case." (~200 words)
- `/contact` — `mailto:` to user email + "Open an issue on GitHub" link if applicable. (~100 words)

Footer of `app/page.tsx` updated to use Next.js `<Link>` instead of `<a href="#">`.

## Phase 2 — Structured data enrichment

### 2.1 FAQPage schema on home

`components/structured-data/faq-jsonld.tsx`:

Questions (6, finalized in this spec — no TBD):

1. **Is the Markdown to PDF converter really free?**
   *Yes. No signup, no watermark, no per-document fee. The site is supported by ads and runs entirely in your browser.*
2. **Do my documents leave my browser?**
   *No. Conversion happens fully client-side in your browser. Your Markdown is never uploaded to any server.*
3. **Which Markdown features are supported?**
   *Headings, bold, italic, strikethrough, lists, tables, blockquotes, code blocks with syntax highlighting, links, images, and horizontal rules. The converter uses GitHub-Flavored Markdown.*
4. **Can I convert Markdown to Microsoft Word (DOCX)?**
   *Yes. Choose DOCX in the format selector before clicking Export. The output is a real .docx file compatible with Word, LibreOffice, and Google Docs.*
5. **Can I customize the PDF output?**
   *Yes. Click the gear icon in the toolbar to choose page size (A4, Letter, Legal), margins, theme (GitHub, Academic, Minimal), fonts, table of contents, cover page, and page numbers.*
6. **Does it work on mobile?**
   *Yes. The editor and preview are responsive. On phones, you toggle between editor and preview; on tablets and desktops, they appear side by side.*

### 2.2 HowTo schema on home

`components/structured-data/howto-jsonld.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to convert Markdown to PDF",
  "description": "Convert Markdown text to a downloadable PDF or DOCX file in four steps.",
  "totalTime": "PT1M",
  "tool": [{"@type": "HowToTool", "name": "Web browser"}],
  "step": [
    {"@type": "HowToStep", "name": "Open the converter", "text": "Visit marktopdf.com — no signup required."},
    {"@type": "HowToStep", "name": "Paste or type your Markdown", "text": "Use the editor on the left. Live preview appears on the right."},
    {"@type": "HowToStep", "name": "Choose your output format", "text": "Select PDF or DOCX from the format dropdown. Customize page size, theme, and other settings via the gear icon."},
    {"@type": "HowToStep", "name": "Export", "text": "Click Export. Your file downloads instantly."}
  ]
}
```

### 2.3 BreadcrumbList on subpages

Generic component `components/structured-data/breadcrumb-jsonld.tsx` that takes `items: { name: string; href: string }[]` and emits JSON-LD. Used on every subpage.

## Phase 3 — Content pages

Four pages. Each renders server-side, exports `metadata`, includes a sticky CTA to the home converter.

### 3.1 `/how-to-convert-markdown-to-pdf` (~600 words)

- H1: "How to Convert Markdown to PDF (Free, Online, No Signup)"
- Sections: Quick answer • Step-by-step (mirrors HowTo schema) • Tips for clean output • FAQ recap
- Includes its own HowTo schema (duplicates home's — that's allowed for content pages)
- BreadcrumbList: Home → How to

### 3.2 `/markdown-to-docx` (~500 words)

- H1: "Markdown to DOCX Converter (Word-Compatible)"
- Sections: Why DOCX • Step-by-step • Compatibility notes (Word, LibreOffice, Google Docs) • CTA
- Same converter — different keyword focus.

### 3.3 `/markdown-cheatsheet` (~800 words)

- H1: "Markdown Cheatsheet — Complete Syntax Reference"
- Sections by topic: Headings • Emphasis • Lists • Links & Images • Code • Quotes • Tables • Horizontal rules • Escaping • GFM extras
- Reference content. Each example shows raw Markdown + rendered output side by side (CSS grid).
- Highest internal-link value — every other page links here as an authority.

### 3.4 `/examples` (~400 words + content)

- H1: "Markdown Examples & Templates"
- 3–5 example documents (Resume, Project README, Technical Spec, Meeting Notes) shown as side-by-side Markdown source + rendered preview. Each has a "Try in editor" link that loads the example into the home page via query string `?example=resume` (cheap to wire — the home page reads the param on mount and pre-populates the editor IF the editor doesn't already have user content beyond the sample).
- BreadcrumbList: Home → Examples

> **Query-param hand-off:** `app/page.tsx` (server component) reads `searchParams.example` (Next.js 16 async search params API), maps to a built-in example markdown, and passes via prop to the client `MarkdownConverter`. The client `MarkdownConverter` reads localStorage on mount via `useDocument`, so the example-vs-restored decision must happen client-side: if `useDocument` restored content from localStorage AND that content differs from `SAMPLE_MARKDOWN`, ignore the example prop. Otherwise adopt it (replacing the sample). Gating logic lives in a client-side `useEffect` inside `MarkdownConverter`, not in the server-side prop pipeline.

## Phase 4 — Performance

### 4.1 Lazy-load jspdf and docx

`MarkdownConverter` is already a `"use client"` component, so dynamic imports inside its handlers Just Work. In `components/markdown-converter.tsx`, change `handleExport` to dynamically import the export module:

```ts
const handleExport = async () => {
  if (!markdown.trim()) return
  setIsExporting(true)
  try {
    const exportFilename = filename.trim() || "document"
    const fullName = format === "pdf" ? `${exportFilename}.pdf` : `${exportFilename}.docx`
    if (format === "pdf") {
      const { exportHtmlToPdf } = await import("@/lib/export/export-pdf")
      await exportHtmlToPdf(html, fullName, exportSettings)
    } else {
      const { exportToDocx } = await import("@/lib/export/export-docx")
      await exportToDocx(markdown, fullName, exportSettings)
    }
    toast.success(`Downloaded ${fullName}`)
  } catch (error) { /* … */ }
  // …
}
```

This removes the jspdf + docx libraries from the initial JS bundle. Rough estimate based on package sizes: ~150–250 KB pre-gzip, ~60–90 KB gzipped (we'll verify with `npm run build` and the actual chunk sizes after implementation). They're loaded the first time the user clicks Export — usually after they've already engaged with the editor for several seconds, so the perceived latency is negligible (and masked by the existing "Generating PDF…" / "Generating DOCX…" button label).

### 4.2 Scripts via `next/script`

Currently `app/layout.tsx` mounts GA via raw `<script>` tags in `<head>`. Switch to `next/script`:

```tsx
<Script src="https://www.googletagmanager.com/gtag/js?id=G-Y19V5P0PN7" strategy="afterInteractive" />
<Script id="ga-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-Y19V5P0PN7');`}</Script>
```

This defers GA past hydration, improving LCP/FID/INP.

AdSense already uses `<Script strategy="afterInteractive">` — verify. JSON-LD stays as inline scripts (it's tiny and server-rendered).

### 4.3 Preconnect to AdSense + GA + GTM

Add `<link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />` and similar for `pagead2.googlesyndication.com` in `<head>` via `metadata`'s `other.link` field, or directly in layout.

### 4.4 CodeMirror dynamic import

The current `MarkdownEditor` is a `'use client'` component but is statically imported by `MarkdownConverter` (which is also a client component). Wrap the import in `next/dynamic` with `{ ssr: false }` inside `MarkdownConverter` (which can use `ssr: false` because it's already a client component — `ssr: false` is forbidden only in server components):

```ts
const MarkdownEditor = dynamic(
  () => import("@/components/editor/markdown-editor").then((m) => m.MarkdownEditor),
  { ssr: false },
)
```

This keeps CodeMirror out of the SSR HTML payload and the initial chunk. The editor card shows a small skeleton on first paint, then CodeMirror loads.

> **Tradeoff:** the editor doesn't appear in the SSR HTML. SEO doesn't care (the editor isn't keyword content), but the perceived first paint shows the empty card briefly. Acceptable.

## Phase 5 — Polish & Lighthouse 100

- Run Lighthouse against the dev server + production build
- Fix every flagged item:
  - Image alt text (any decorative images get `alt=""`, content images get descriptive alt)
  - Tap target sizes on mobile (toolbar icons currently 32×32 — Lighthouse requires 48×48 for tap targets; bump to `size-8` plus padding makes effective hit area larger, or accept the warning since this is a power-user tool)
  - Link text descriptiveness (any "Click here" → real text)
  - Color contrast (verify shadcn's tokens already pass)
- Validate every JSON-LD schema with `https://validator.schema.org/` and Google's Rich Results test (`https://search.google.com/test/rich-results`)
- Verify `<title>` ≤60 chars and `<meta description>` ≤160 chars per route
- Add `<noscript>` fallback content: a short message saying "This converter requires JavaScript. Here's what it does: …" — gives crawlers something even if they don't run JS

## Risks & decisions

1. **`SoftwareApplication` rich result eligibility** — Google typically requires `aggregateRating` for SoftwareApplication rich results to display. We refuse to fake ratings (manual penalty risk). Result: schema is valid and indexed, but a Knowledge-Panel-style rich result is unlikely until the site accumulates real reviews from a third-party source. Worth doing anyway — `name`, `description`, `featureList`, `offers` still feed Google's understanding of the page.
2. **`HowTo` rich results were globally removed by Google in September 2023.** The schema is still valid and crawlers parse it for content understanding, but no rich result is expected today. Keeping it as harmless metadata; do not set expectations around blue-link enhancement.
3. **`FAQPage` rich results were downgraded in 2023** — only shown for "well-known, authoritative sites." Still worth doing; the schema is valid for users who view source and for future eligibility, and sometimes triggers regardless.
4. **Dynamic OG image latency** — `next/og` `ImageResponse` runs in the Edge runtime on Vercel; ~50ms cold. First social share crawler may see slightly delayed image, but most cache it after first fetch.
5. **`/examples` query-param hand-off** is mildly clever but limited: only adopts the example if the user has no autosaved content (or only the sample). Power users with a non-sample doc see no change. Acceptable.
6. **Lazy-loading export libs adds a small loading delay** on first export click (one bundle fetch, ~50–200 ms on cable). The Export button already shows "Generating PDF…", so this is masked.
7. **Removing `public/robots.txt`** in favor of `app/robots.ts` is a Next.js convention shift — make sure no external SEO scanner has it cached. Robots files re-crawl frequently, so this is low-risk.
8. **AdSense + future Content-Security-Policy** — current GA + AdSense rely on inline scripts and external script loads from `pagead2.googlesyndication.com` / `googletagmanager.com`. If a strict CSP is added later, those domains and `'unsafe-inline'` (or hashed inline) must be allowlisted. No CSP is added in this overhaul; flagging so a future security pass knows to plan for it.
9. **Google Search Console re-submission** — after the domain fix in sitemap.ts + robots.ts, the new sitemap should be re-submitted in Search Console. If both `marktopdf.com` and `markdowntopdf.com` were ever indexed, the wrong-domain URLs may persist; add a 301 redirect at the DNS/edge layer or in `next.config.ts` if needed. Out of scope for this code change but flagged for manual follow-up after merge.
10. **Manifest validity post-icon changes** — Lighthouse's PWA category checks that manifest icons resolve and have correct `sizes`. The `generateImageMetadata` approach (Phase 1.2) produces resolvable URLs at `/icon/medium` and `/icon/large`. Verify with a manual fetch in Phase 5 before declaring complete.

## Testing

- Existing 50 e2e tests must continue to pass on Chromium
- Add new e2e specs:
  - `e2e/seo-metadata.spec.ts` — verify `<title>`, `<meta description>`, `<meta property="og:image">`, canonical URL on home + each subpage
  - `e2e/seo-structured-data.spec.ts` — for each page with JSON-LD, parse and assert `@type` matches expected (SoftwareApplication, FAQPage, HowTo, BreadcrumbList)
  - `e2e/sitemap-robots.spec.ts` — fetch `/sitemap.xml` and `/robots.txt`, assert they return 200 with correct domain
  - `e2e/content-pages.spec.ts` — visit each new page, assert H1 + main copy + CTA link to home present
- Manual: validate every page with `validator.schema.org` and Google Rich Results test before merge

## Out of scope (deferred)

- MDX-powered blog
- i18n / hreflang for non-English
- WebP / AVIF image optimization (no images yet)
- Accessibility audit beyond Lighthouse SEO basics
- A/B testing infrastructure
- Analytics dashboard / cohort tracking
- Site search (no SearchAction schema)
- Cloud sync / accounts (still out of scope from prior overhaul)
