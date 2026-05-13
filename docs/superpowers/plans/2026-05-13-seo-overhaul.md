# SEO Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the site's SEO from "metadata wired but broken" to "production-grade with rich-snippet eligibility and Core Web Vitals headroom." Five phases: fix bugs, enrich structured data, add 4 content pages, lazy-load heavy bundles, hit Lighthouse SEO 100.

**Architecture:** Next.js 16 App Router file conventions for sitemap/robots/icons/OG images (no static asset wrangling). Each JSON-LD schema lives in its own server component under `components/structured-data/` for reuse and tree-shakability. Content pages are server components with their own metadata exports. Heavy export libs (jspdf/docx) move from initial bundle to lazy `import()` on demand.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn primitives, `next/og` for dynamic images, `next/script` for deferred scripts. Tests via Playwright (e2e/).

**Spec:** `docs/superpowers/specs/2026-05-13-seo-overhaul-design.md`

**Live domain:** `marktopdf.com`

---

## File map

**Created**
- `app/robots.ts`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- `app/icon.tsx` (uses `generateImageMetadata` to emit 32/192/512)
- `app/apple-icon.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/contact/page.tsx`
- `app/how-to-convert-markdown-to-pdf/page.tsx`
- `app/markdown-to-docx/page.tsx`
- `app/markdown-cheatsheet/page.tsx`
- `app/examples/page.tsx`
- `lib/seo/json-ld.ts` (`safeJsonLd` helper)
- `components/structured-data/base-jsonld.tsx`
- `components/structured-data/faq-jsonld.tsx`
- `components/structured-data/howto-jsonld.tsx`
- `components/structured-data/breadcrumb-jsonld.tsx`
- `components/seo/site-footer.tsx`
- `lib/seo/examples.ts`
- `e2e/seo-metadata.spec.ts`
- `e2e/seo-structured-data.spec.ts`
- `e2e/sitemap-robots.spec.ts`
- `e2e/content-pages.spec.ts`

**Modified**
- `app/layout.tsx` — `next/script` for GA, remove inline JSON-LD, preconnect links
- `app/page.tsx` — H1 fix, footer replaced, JSON-LD mounted, example query-param prop
- `app/sitemap.ts` — fix domain, add all routes
- `public/manifest.json` — point icons to `/icon/medium` and `/icon/large`
- `components/markdown-converter.tsx` — lazy `import()` jspdf+docx, `next/dynamic` editor, `initialExample` prop

**Deleted**
- `public/robots.txt`

---

## Conventions

- **Branch:** `feat/seo-overhaul`
- **Commit style:** conventional commits. **No `Co-Authored-By`. No `--no-verify`.**
- **JSON-LD pattern:** every schema component uses a small helper `safeJsonLd(data)` that does `JSON.stringify(data).replace(/</g, '\\u003c')`, then renders as text children of a `<script type="application/ld+json">` element. This pattern:
  1. Avoids React's standard XSS-prevention HTML-injection prop entirely
  2. Pre-escapes `<` to `<` which JSON-LD parsers accept as a valid escape, blocking any `</script>` injection in stringified content
  3. Lets React render the script's children as plain text — no escaping concerns because the only character it would escape (`<`) has been pre-escaped to a JSON escape sequence
  This is more secure than the legacy `dangerouslySetInnerHTML` pattern that the existing `app/layout.tsx` uses for JSON-LD. Phase 2 establishes the helper and migrates the home page; the existing layout.tsx inline JSON-LD is removed in Task 2.1.
- **Lint baseline:** 0 errors, 4 warnings before Phase 0. New errors fail; new warnings need justification.
- **TDD:** add Playwright tests for routes/metadata/structured-data shape. Pure helpers covered indirectly.
- **Verification:** after every task `npx tsc --noEmit && npm run lint`. After every phase add `npm run build` and `npm run test:chromium`.

---

# Phase 0 — Pre-flight

### Task 0.1: Create branch + verify baseline

**Files:** none

- [ ] **Step 1: Branch**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
git status
git checkout -b feat/seo-overhaul
```

- [ ] **Step 2: Baseline**

```bash
npm run lint
npx tsc --noEmit
npm run test:chromium
```

Expected: 0 errors / 4 warnings, tsc clean, 50/50 e2e.

- [ ] **Step 3: No commit; empty branch.**

---

# Phase 1 — Bug fixes & infrastructure

### Task 1.1: Create `lib/seo/json-ld.ts` helper

**Files:**
- Create: `lib/seo/json-ld.ts`

- [ ] **Step 1: Write the helper**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/seo/json-ld.ts`:

```ts
/**
 * Serialize JSON-LD data for safe inclusion as text content
 * inside a <script type="application/ld+json"> element.
 *
 * Replaces every "<" with the JSON escape "<" so that:
 *  - React won't try to escape the angle bracket when rendering as text
 *    (it would break JSON-LD parsing)
 *  - Any "</script>" sequence in the stringified data becomes inert
 *    (a script tag cannot be terminated by an escaped < sequence)
 *
 * This is the recommended pattern (Mozilla, OWASP) for inline JSON
 * blocks and is more secure than React's standard HTML-injection prop.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/seo/json-ld.ts
git commit -m "feat(seo): add safeJsonLd helper for inline JSON-LD blocks"
```

### Task 1.2: Fix sitemap domain + add subpages

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Replace contents**

Replace `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/sitemap.ts`:

```ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marktopdf.com'
  const now = new Date()

  return [
    { url: `${baseUrl}/`,                                 lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/how-to-convert-markdown-to-pdf`,   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/markdown-to-docx`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/markdown-cheatsheet`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/examples`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`,                          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,                            lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/contact`,                          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/sitemap.ts
git commit -m "fix(seo): correct sitemap domain and add subpage routes"
```

### Task 1.3: Replace robots.txt with app/robots.ts

**Files:**
- Create: `app/robots.ts`
- Delete: `public/robots.txt`

- [ ] **Step 1: Write app/robots.ts**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/robots.ts`:

```ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marktopdf.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/private/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
```

- [ ] **Step 2: Delete static robots.txt**

```bash
git rm public/robots.txt
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/robots.ts
git commit -m "fix(seo): replace static robots.txt with route handler"
```

### Task 1.4: Dynamic OG image

**Files:**
- Create: `app/opengraph-image.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Markdown to PDF Converter — Free Online Tool"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, display: "flex", alignItems: "center" }}>
          <span style={{ color: "#7c3aed" }}>Markdown</span>
          <span style={{ margin: "0 24px", opacity: 0.5 }}>→</span>
          <span>PDF</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 36, opacity: 0.85, textAlign: "center" }}>
          Free online converter with live preview
        </div>
        <div style={{ marginTop: 80, fontSize: 24, opacity: 0.5 }}>marktopdf.com</div>
      </div>
    ),
    { width: size.width, height: size.height },
  )
}
```

- [ ] **Step 2: Smoke**

```bash
npx tsc --noEmit && npm run lint
npm run dev
```

Open `http://localhost:3000/opengraph-image`. Expect a 1200×630 PNG. Kill dev.

- [ ] **Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "feat(seo): add dynamic OpenGraph image via next/og"
```

### Task 1.5: Twitter image

**Files:**
- Create: `app/twitter-image.tsx`

- [ ] **Step 1: Write (re-export)**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/twitter-image.tsx`:

```tsx
export { default, alt, size, contentType, runtime } from "./opengraph-image"
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/twitter-image.tsx
git commit -m "feat(seo): add Twitter card image (reuses OG image)"
```

### Task 1.6: Dynamic icons (32/192/512)

**Files:**
- Create: `app/icon.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/icon.tsx`:

```tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"

export function generateImageMetadata() {
  return [
    { id: "small",  size: { width: 32,  height: 32 },  contentType: "image/png" },
    { id: "medium", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "large",  size: { width: 512, height: 512 }, contentType: "image/png" },
  ]
}

export default async function Icon({ id }: { id: string }) {
  const dim = id === "small" ? 32 : id === "medium" ? 192 : 512
  const fontSize = Math.round(dim * 0.6)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7c3aed",
          color: "white",
          fontSize,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          borderRadius: dim * 0.2,
        }}
      >
        M
      </div>
    ),
    { width: dim, height: dim },
  )
}
```

- [ ] **Step 2: Smoke**

```bash
npm run dev
```

Open `/icon/small`, `/icon/medium`, `/icon/large` — all render. Kill dev.

- [ ] **Step 3: Commit**

```bash
git add app/icon.tsx
git commit -m "feat(seo): add dynamic icons (32/192/512) via generateImageMetadata"
```

### Task 1.7: Apple-touch-icon

**Files:**
- Create: `app/apple-icon.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/apple-icon.tsx`:

```tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7c3aed",
          color: "white",
          fontSize: 108,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        M
      </div>
    ),
    { width: size.width, height: size.height },
  )
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/apple-icon.tsx
git commit -m "feat(seo): add apple-touch-icon via next/og"
```

### Task 1.8: Update manifest.json

**Files:**
- Modify: `public/manifest.json`

- [ ] **Step 1: Replace contents**

Replace `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/public/manifest.json`:

```json
{
  "name": "Markdown to PDF Converter",
  "short_name": "MD to PDF",
  "description": "Free online Markdown to PDF and DOCX converter with live preview",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icon/medium", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon/large",  "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "fix(seo): point manifest icons to dynamic icon routes"
```

### Task 1.9: H1 fix

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Edit**

In `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/page.tsx`, replace:

```tsx
              <h1 className="text-2xl md:text-3xl font-bold">
                Markdown Converter
              </h1>
```

with:

```tsx
              <h1 className="text-2xl md:text-3xl font-bold">
                Markdown to PDF Converter
              </h1>
```

- [ ] **Step 2: Verify the existing 'main heading' test still passes**

```bash
npx playwright test e2e/markdown-converter.spec.ts:9 --project=chromium
```

Expected: pass — the assertion is `toContainText('Markdown Converter')` which "Markdown to PDF Converter" satisfies.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "fix(seo): expand H1 to include 'to PDF' keyword"
```

### Task 1.10: Privacy page

**Files:**
- Create: `app/privacy/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/privacy/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/privacy/page.tsx
git commit -m "feat(seo): add /privacy page"
```

### Task 1.11: Terms page

**Files:**
- Create: `app/terms/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/terms/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/terms/page.tsx
git commit -m "feat(seo): add /terms page"
```

### Task 1.12: Contact page

**Files:**
- Create: `app/contact/page.tsx`

- [ ] **Step 1: Write**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/contact/page.tsx`:

```tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about marktopdf.com — bug reports, feature requests, or feedback.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-sm">
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
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add app/contact/page.tsx
git commit -m "feat(seo): add /contact page"
```

### Task 1.13: SiteFooter component + replace home footer

**Files:**
- Create: `components/seo/site-footer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/seo/site-footer.tsx`:

```tsx
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Markdown to PDF Converter. Free online tool.
          </p>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground" aria-label="Site footer">
            <Link href="/how-to-convert-markdown-to-pdf" className="hover:text-foreground transition-colors">How to use</Link>
            <Link href="/markdown-cheatsheet" className="hover:text-foreground transition-colors">Cheatsheet</Link>
            <Link href="/examples" className="hover:text-foreground transition-colors">Examples</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Use it in `app/page.tsx`**

Add import:

```tsx
import { SiteFooter } from "@/components/seo/site-footer"
```

Replace the existing `<footer>...</footer>` block with `<SiteFooter />`.

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
git add components/seo/site-footer.tsx app/page.tsx
git commit -m "feat(seo): replace dead footer links with real navigation"
```

### Task 1.14: Phase 1 verification

- [ ] **Step 1: Full check**

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all pass.

- [ ] **Step 2: Manual smoke**

```bash
npm run dev
```

In browser, verify:
- `/` — H1 "Markdown to PDF Converter"; footer has real Links
- `/privacy`, `/terms`, `/contact` — render
- `/robots.txt` — dynamic, `marktopdf.com` host
- `/sitemap.xml` — 8 URLs, all `marktopdf.com`
- `/opengraph-image` — PNG renders
- `/icon/small`, `/icon/medium`, `/icon/large`, `/apple-icon` — PNGs render
- `/manifest.json` — points to dynamic icons

Kill dev. No commit.

---

# Phase 2 — Structured data

### Task 2.1: SoftwareApplication JSON-LD

**Files:**
- Create: `components/structured-data/base-jsonld.tsx`
- Modify: `app/layout.tsx` (delete inline JSON-LD)
- Modify: `app/page.tsx` (mount new component)

- [ ] **Step 1: Create the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/structured-data/base-jsonld.tsx`:

```tsx
import { safeJsonLd } from "@/lib/seo/json-ld"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://marktopdf.com"

const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Markdown to PDF Converter",
  description:
    "Free online Markdown to PDF and DOCX converter with live preview, syntax highlighting, autosave, and customizable export settings.",
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  applicationSubCategory: "Document Converter",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript. Modern browser (Chrome, Firefox, Safari, Edge).",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Convert Markdown to PDF",
    "Convert Markdown to DOCX",
    "Live syntax-highlighted editor with CodeMirror",
    "Drag-and-drop file upload",
    "Multiple themes (GitHub, Academic, Minimal)",
    "Customizable page size, margins, fonts",
    "Table of contents generation",
    "Cover page and page numbers",
    "Autosave to browser storage",
    "No signup required, fully client-side",
  ],
}

export function SoftwareAppJsonLd() {
  return (
    <script type="application/ld+json">{safeJsonLd(SOFTWARE_APP_JSONLD)}</script>
  )
}
```

- [ ] **Step 2: Remove inline JSON-LD from `app/layout.tsx`**

In `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/layout.tsx`, delete the entire `const jsonLd = { ... }` block AND the matching `<script type="application/ld+json" ... />` inside `<head>`. The home page will own its own schema; subpages will own theirs.

- [ ] **Step 3: Mount in `app/page.tsx`**

Add import:

```tsx
import { SoftwareAppJsonLd } from "@/components/structured-data/base-jsonld"
```

Add `<SoftwareAppJsonLd />` immediately inside the opening `<main>` tag.

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add components/structured-data/base-jsonld.tsx app/layout.tsx app/page.tsx
git commit -m "feat(seo): SoftwareApplication JSON-LD (replaces WebApplication on home)"
```

### Task 2.2: FAQPage JSON-LD + visible FAQ

**Files:**
- Create: `components/structured-data/faq-jsonld.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/structured-data/faq-jsonld.tsx`:

```tsx
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
```

- [ ] **Step 2: Mount in `app/page.tsx`**

Add import:

```tsx
import { FaqJsonLd, FaqVisible } from "@/components/structured-data/faq-jsonld"
```

Add `<FaqJsonLd />` after `<SoftwareAppJsonLd />`. Add `<FaqVisible />` between the existing SEO content section and the footer.

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
npm run test:chromium
git add components/structured-data/faq-jsonld.tsx app/page.tsx
git commit -m "feat(seo): FAQPage JSON-LD + visible FAQ on home"
```

### Task 2.3: HowTo JSON-LD

**Files:**
- Create: `components/structured-data/howto-jsonld.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/structured-data/howto-jsonld.tsx`:

```tsx
import { safeJsonLd } from "@/lib/seo/json-ld"

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to convert Markdown to PDF",
  description: "Convert Markdown text to a downloadable PDF or DOCX file in four steps.",
  totalTime: "PT1M",
  tool: [{ "@type": "HowToTool", name: "Web browser" }],
  step: [
    { "@type": "HowToStep", name: "Open the converter", text: "Visit marktopdf.com — no signup required." },
    { "@type": "HowToStep", name: "Paste or type your Markdown", text: "Use the editor on the left. Live preview appears on the right." },
    { "@type": "HowToStep", name: "Choose your output format", text: "Select PDF or DOCX from the format dropdown. Customize page size, theme, and other settings via the gear icon." },
    { "@type": "HowToStep", name: "Export", text: "Click Export. Your file downloads instantly." },
  ],
}

export function HowToJsonLd() {
  return <script type="application/ld+json">{safeJsonLd(HOWTO_JSONLD)}</script>
}
```

- [ ] **Step 2: Mount in `app/page.tsx`**

Add import + `<HowToJsonLd />` after `<FaqJsonLd />`.

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add components/structured-data/howto-jsonld.tsx app/page.tsx
git commit -m "feat(seo): HowTo JSON-LD on home"
```

### Task 2.4: BreadcrumbList generator + apply on legal pages

**Files:**
- Create: `components/structured-data/breadcrumb-jsonld.tsx`
- Modify: `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/contact/page.tsx`

- [ ] **Step 1: Create**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/structured-data/breadcrumb-jsonld.tsx`:

```tsx
import { safeJsonLd } from "@/lib/seo/json-ld"

interface BreadcrumbItem {
  name: string
  href: string
}

interface Props {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marktopdf.com"
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  }
  return <script type="application/ld+json">{safeJsonLd(data)}</script>
}
```

- [ ] **Step 2: Apply to legal pages**

In each of `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/contact/page.tsx`, add at the top:

```tsx
import { BreadcrumbJsonLd } from "@/components/structured-data/breadcrumb-jsonld"
```

Inside the returned `<main>`, before the `<nav>` element, add the corresponding crumbs:

- `/privacy`: `<BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Privacy", href: "/privacy" }]} />`
- `/terms`: `<BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Terms", href: "/terms" }]} />`
- `/contact`: `<BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} />`

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git add components/structured-data/breadcrumb-jsonld.tsx app/privacy/page.tsx app/terms/page.tsx app/contact/page.tsx
git commit -m "feat(seo): BreadcrumbList on legal pages"
```

### Task 2.5: Phase 2 verification

- [ ] **Step 1: Full check**

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all pass.

- [ ] **Step 2: Manual structured-data validation**

```bash
npm run dev
```

View source on `/`, `/privacy`, `/terms`, `/contact`. Confirm `<script type="application/ld+json">` blocks present. Copy each JSON content into `https://validator.schema.org/` and confirm zero errors.

Kill dev. No commit.

---

# Phase 3 — Content pages

Continued in `2026-05-13-seo-overhaul-phase-3-5.md`.
