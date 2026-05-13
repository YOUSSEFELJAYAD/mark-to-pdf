# Phase 3 — Export Customization (continuation)

**Parent plan:** `2026-05-13-converter-ux-overhaul.md`

> Start here only after Phase 1 + Phase 2 are complete and on `feat/converter-ux-overhaul`.

---

### Task 3.1: Move export libs to `lib/export/`

**Files:**
- Move: `lib/export-pdf.ts` → `lib/export/export-pdf.ts`
- Move: `lib/export-docx.ts` → `lib/export/export-docx.ts`
- Modify: `components/markdown-converter.tsx` (import paths)

- [ ] **Step 1: Move with git**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
mkdir -p lib/export
git mv lib/export-pdf.ts lib/export/export-pdf.ts
git mv lib/export-docx.ts lib/export/export-docx.ts
```

- [ ] **Step 2: Update import paths in `components/markdown-converter.tsx`**

- `from "@/lib/export-pdf"` → `from "@/lib/export/export-pdf"`
- `from "@/lib/export-docx"` → `from "@/lib/export/export-docx"`

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run test:chromium
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add lib/export/ components/markdown-converter.tsx
git commit -m "refactor: move export modules to lib/export/"
```

### Task 3.2: Create `lib/export/themes.ts`

**Files:**
- Create: `lib/export/themes.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/export/themes.ts`:

```ts
export type ThemeId = "github" | "academic" | "minimal"

export interface ThemeStyle {
  bodyFont: { sans: string; serif: string; mono: string }
  body: { size: number; lineHeight: number }
  headings: { sizes: [number, number, number, number, number, number]; weight: "bold" | "semibold" }
  code: { size: number; bg: [number, number, number] }
  quote: { color: [number, number, number]; borderColor: [number, number, number] }
  hr: { color: [number, number, number] }
  table: { borderColor: [number, number, number]; headerBg: [number, number, number] }
  spacing: { paragraph: number; headingTop: [number, number, number, number, number, number] }
}

export const THEMES: Record<ThemeId, ThemeStyle> = {
  github: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 5 },
    headings: { sizes: [24, 18, 14, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [244, 244, 244] },
    quote: { color: [100, 100, 100], borderColor: [200, 200, 200] },
    hr: { color: [200, 200, 200] },
    table: { borderColor: [200, 200, 200], headerBg: [230, 230, 230] },
    spacing: { paragraph: 2, headingTop: [0, 4, 3, 2, 2, 2] },
  },
  academic: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 5.5 },
    headings: { sizes: [22, 17, 14, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [248, 248, 248] },
    quote: { color: [80, 80, 80], borderColor: [180, 180, 180] },
    hr: { color: [180, 180, 180] },
    table: { borderColor: [180, 180, 180], headerBg: [240, 240, 240] },
    spacing: { paragraph: 3, headingTop: [0, 6, 4, 3, 3, 3] },
  },
  minimal: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 6 },
    headings: { sizes: [22, 16, 13, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [252, 252, 252] },
    quote: { color: [120, 120, 120], borderColor: [220, 220, 220] },
    hr: { color: [220, 220, 220] },
    table: { borderColor: [220, 220, 220], headerBg: [245, 245, 245] },
    spacing: { paragraph: 3, headingTop: [0, 5, 4, 3, 3, 3] },
  },
}

export type PageSize = "A4" | "Letter" | "Legal"
export type MarginPreset = "narrow" | "normal" | "wide"
export type FontFamily = "sans" | "serif" | "mono"
export type HeadingFontFamily = FontFamily | "match"
export type TocDepth = "off" | "h1-h2" | "h1-h3"
export type PageNumbers = "off" | "footer-center" | "footer-right"

export interface ExportSettings {
  pageSize: PageSize
  margin: MarginPreset
  theme: ThemeId
  bodyFont: FontFamily
  headingFont: HeadingFontFamily
  toc: TocDepth
  pageNumbers: PageNumbers
  coverPage: boolean
}

export const DEFAULT_SETTINGS: ExportSettings = {
  pageSize: "A4",
  margin: "normal",
  theme: "github",
  bodyFont: "sans",
  headingFont: "match",
  toc: "off",
  pageNumbers: "off",
  coverPage: false,
}

export const MARGIN_MM: Record<MarginPreset, number> = {
  narrow: 10,
  normal: 20,
  wide: 30,
}

export function resolveBodyFont(theme: ThemeStyle, family: FontFamily): string {
  return theme.bodyFont[family]
}

export function resolveHeadingFont(
  theme: ThemeStyle,
  body: FontFamily,
  heading: HeadingFontFamily,
): string {
  return theme.bodyFont[heading === "match" ? body : heading]
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/export/themes.ts
git commit -m "feat: add export themes and settings types"
```

### Task 3.3: Create `useExportSettings` hook

**Files:**
- Create: `hooks/use-export-settings.ts`

- [ ] **Step 1: Write the hook**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/hooks/use-export-settings.ts`:

```ts
"use client"

import * as React from "react"
import { read, write, STORAGE_KEYS } from "@/lib/storage"
import { DEFAULT_SETTINGS, type ExportSettings } from "@/lib/export/themes"

export function useExportSettings() {
  const [settings, setSettings] = React.useState<ExportSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const stored = read<ExportSettings>(STORAGE_KEYS.exportSettings)
    if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored })
    setHydrated(true)
  }, [])

  const update = React.useCallback((partial: Partial<ExportSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      write<ExportSettings>(STORAGE_KEYS.exportSettings, next)
      return next
    })
  }, [])

  const reset = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    write<ExportSettings>(STORAGE_KEYS.exportSettings, DEFAULT_SETTINGS)
  }, [])

  return { settings, update, reset, hydrated }
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add hooks/use-export-settings.ts
git commit -m "feat: add useExportSettings hook"
```

### Task 3.4: Create `lib/export/toc.ts`

**Files:**
- Create: `lib/export/toc.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/export/toc.ts`:

```ts
import { marked, type Token } from "marked"
import type { TocDepth } from "./themes"

export interface TocEntry {
  level: 1 | 2 | 3
  text: string
}

export function extractTocEntries(markdown: string, depth: TocDepth): TocEntry[] {
  if (depth === "off") return []
  const maxLevel = depth === "h1-h2" ? 2 : 3
  const tokens = marked.lexer(markdown)
  const entries: TocEntry[] = []
  for (const tok of tokens as Token[]) {
    if (tok.type === "heading" && typeof tok.depth === "number" && tok.depth >= 1 && tok.depth <= maxLevel) {
      entries.push({ level: tok.depth as 1 | 2 | 3, text: String(tok.text ?? "") })
    }
  }
  return entries
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/export/toc.ts
git commit -m "feat: add TOC extraction from markdown tokens"
```

### Task 3.5: Refactor `lib/export/export-pdf.ts` to accept ExportSettings

**Files:**
- Modify: `lib/export/export-pdf.ts`

**Important change vs. old code:** the old `exportHtmlToPdf` built a detached `<div>` from a string via an imperative DOM-injection prop. We replace that with `new DOMParser().parseFromString(html, "text/html").body` — same DOM tree, safer modern API.

- [ ] **Step 1: Replace file contents**

Replace `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/export/export-pdf.ts` with:

```ts
"use client"

import jsPDF from "jspdf"
import {
  DEFAULT_SETTINGS,
  MARGIN_MM,
  THEMES,
  resolveBodyFont,
  resolveHeadingFont,
  type ExportSettings,
  type ThemeStyle,
} from "./themes"

interface RenderContext {
  pdf: jsPDF
  settings: ExportSettings
  theme: ThemeStyle
  bodyFontName: string
  headingFontName: string
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
  yPosition: number
}

function makeContext(pdf: jsPDF, settings: ExportSettings): RenderContext {
  const theme = THEMES[settings.theme]
  const margin = MARGIN_MM[settings.margin]
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  return {
    pdf,
    settings,
    theme,
    bodyFontName: resolveBodyFont(theme, settings.bodyFont),
    headingFontName: resolveHeadingFont(theme, settings.bodyFont, settings.headingFont),
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    yPosition: margin,
  }
}

function checkPageBreak(ctx: RenderContext, neededSpace: number): void {
  if (ctx.yPosition + neededSpace > ctx.pageHeight - ctx.margin) {
    ctx.pdf.addPage()
    ctx.yPosition = ctx.margin
  }
}

function addText(
  ctx: RenderContext,
  text: string,
  style: "normal" | "bold" | "italic",
  size: number,
  fontName: string,
  xOffset = ctx.margin,
): void {
  ctx.pdf.setFont(fontName, style)
  ctx.pdf.setFontSize(size)
  ctx.pdf.setTextColor(0, 0, 0)
  const lines = ctx.pdf.splitTextToSize(text, ctx.contentWidth - (xOffset - ctx.margin))
  lines.forEach((line: string) => {
    checkPageBreak(ctx, size * 0.4)
    ctx.pdf.text(line, xOffset, ctx.yPosition)
    ctx.yPosition += size * 0.45
  })
}

function renderTable(ctx: RenderContext, table: HTMLElement): void {
  const rows = Array.from(table.querySelectorAll("tr"))
  if (rows.length === 0) return
  ctx.yPosition += 4
  const cellPadding = 3
  const rowHeight = 8

  for (const row of rows) {
    checkPageBreak(ctx, rowHeight)
    const cells = Array.from(row.querySelectorAll("th, td"))
    const cellWidth = ctx.contentWidth / cells.length
    cells.forEach((cell, idx) => {
      const x = ctx.margin + idx * cellWidth
      const isHeader = cell.tagName.toLowerCase() === "th"
      if (isHeader) {
        const [r, g, b] = ctx.theme.table.headerBg
        ctx.pdf.setFillColor(r, g, b)
        ctx.pdf.rect(x, ctx.yPosition - 5, cellWidth, rowHeight, "F")
      }
      const [br, bg, bb] = ctx.theme.table.borderColor
      ctx.pdf.setDrawColor(br, bg, bb)
      ctx.pdf.rect(x, ctx.yPosition - 5, cellWidth, rowHeight, "S")
      ctx.pdf.setFont(ctx.bodyFontName, isHeader ? "bold" : "normal")
      ctx.pdf.setFontSize(9)
      ctx.pdf.text(cell.textContent || "", x + cellPadding, ctx.yPosition)
    })
    ctx.yPosition += rowHeight
  }
  ctx.yPosition += 4
}

function renderNode(ctx: RenderContext, node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim()
    if (text) addText(ctx, text, "normal", ctx.theme.body.size, ctx.bodyFontName)
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const t = ctx.theme

  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(tag[1]) - 1
      ctx.yPosition += t.spacing.headingTop[level]
      addText(ctx, el.textContent || "", "bold", t.headings.sizes[level], ctx.headingFontName)
      ctx.yPosition += 2
      break
    }
    case "p":
      addText(ctx, el.textContent || "", "normal", t.body.size, ctx.bodyFontName)
      ctx.yPosition += t.spacing.paragraph
      break
    case "ul":
    case "ol": {
      const liItems = el.querySelectorAll(":scope > li")
      liItems.forEach((li, idx) => {
        const bullet = tag === "ol" ? `${idx + 1}. ` : "• "
        addText(ctx, bullet + (li.textContent || ""), "normal", t.body.size, ctx.bodyFontName, ctx.margin + 5)
      })
      ctx.yPosition += 2
      break
    }
    case "pre": {
      ctx.yPosition += 2
      const [r, g, b] = t.code.bg
      ctx.pdf.setFillColor(r, g, b)
      const codeText = el.textContent || ""
      const codeLines = ctx.pdf.splitTextToSize(codeText, ctx.contentWidth - 10)
      const codeHeight = codeLines.length * 5 + 6
      ctx.pdf.rect(ctx.margin, ctx.yPosition - 2, ctx.contentWidth, codeHeight, "F")
      ctx.pdf.setFont("courier", "normal")
      ctx.pdf.setFontSize(t.code.size)
      codeLines.forEach((line: string) => {
        checkPageBreak(ctx, 5)
        ctx.pdf.text(line, ctx.margin + 5, ctx.yPosition)
        ctx.yPosition += 5
      })
      ctx.pdf.setFont(ctx.bodyFontName, "normal")
      ctx.yPosition += 4
      break
    }
    case "blockquote": {
      ctx.yPosition += 2
      const [br, bg, bb] = t.quote.borderColor
      ctx.pdf.setDrawColor(br, bg, bb)
      ctx.pdf.setLineWidth(1)
      const quoteText = el.textContent || ""
      const quoteLines = ctx.pdf.splitTextToSize(quoteText, ctx.contentWidth - 15)
      ctx.pdf.line(ctx.margin + 2, ctx.yPosition - 2, ctx.margin + 2, ctx.yPosition + quoteLines.length * 5)
      const [qr, qg, qb] = t.quote.color
      ctx.pdf.setFont(ctx.bodyFontName, "italic")
      ctx.pdf.setTextColor(qr, qg, qb)
      quoteLines.forEach((line: string) => {
        checkPageBreak(ctx, 5)
        ctx.pdf.text(line, ctx.margin + 8, ctx.yPosition)
        ctx.yPosition += 5
      })
      ctx.pdf.setFont(ctx.bodyFontName, "normal")
      ctx.pdf.setTextColor(0, 0, 0)
      ctx.yPosition += 4
      break
    }
    case "hr": {
      ctx.yPosition += 4
      const [r, g, b] = t.hr.color
      ctx.pdf.setDrawColor(r, g, b)
      ctx.pdf.setLineWidth(0.5)
      ctx.pdf.line(ctx.margin, ctx.yPosition, ctx.pageWidth - ctx.margin, ctx.yPosition)
      ctx.yPosition += 6
      break
    }
    case "table":
      renderTable(ctx, el)
      break
    case "code":
      break
    default:
      el.childNodes.forEach((child) => renderNode(ctx, child))
  }
}

function renderBody(ctx: RenderContext, container: HTMLElement): void {
  container.childNodes.forEach((node) => renderNode(ctx, node))
}

function renderCover(ctx: RenderContext, title: string | null): void {
  if (!title) return
  const centerY = ctx.pageHeight / 2
  ctx.pdf.setFont(ctx.headingFontName, "bold")
  ctx.pdf.setFontSize(36)
  ctx.pdf.setTextColor(0, 0, 0)
  const lines = ctx.pdf.splitTextToSize(title, ctx.contentWidth)
  let y = centerY - (lines.length * 10) / 2
  for (const line of lines) {
    const w = ctx.pdf.getTextWidth(line)
    ctx.pdf.text(line, (ctx.pageWidth - w) / 2, y)
    y += 12
  }
  ctx.pdf.setFont(ctx.bodyFontName, "normal")
  ctx.pdf.setFontSize(ctx.theme.body.size)
  ctx.pdf.addPage()
  ctx.yPosition = ctx.margin
}

interface TocLine {
  level: 1 | 2 | 3
  text: string
}

function collectTocLines(container: HTMLElement, depth: ExportSettings["toc"]): TocLine[] {
  if (depth === "off") return []
  const selector = depth === "h1-h2" ? "h1, h2" : "h1, h2, h3"
  return Array.from(container.querySelectorAll(selector)).map((el) => ({
    level: Number(el.tagName[1]) as 1 | 2 | 3,
    text: el.textContent?.trim() ?? "",
  }))
}

function measureHeadingPages(
  container: HTMLElement,
  settings: ExportSettings,
): number[] {
  const measurePdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: settings.pageSize.toLowerCase() as "a4" | "letter" | "legal",
  })
  const ctx = makeContext(measurePdf, settings)
  const selector = settings.toc === "h1-h2" ? "h1, h2" : "h1, h2, h3"
  const headings = Array.from(container.querySelectorAll(selector))
  const pages: number[] = []
  let cursor = 0

  const walk = (node: Node) => {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      cursor < headings.length &&
      node === headings[cursor]
    ) {
      pages.push(measurePdf.getNumberOfPages())
      cursor++
    }
    renderNode(ctx, node)
  }
  container.childNodes.forEach(walk)
  return pages
}

function renderToc(
  ctx: RenderContext,
  tocLines: TocLine[],
  headingPages: number[],
): void {
  if (tocLines.length === 0) return

  ctx.pdf.setFont(ctx.headingFontName, "bold")
  ctx.pdf.setFontSize(ctx.theme.headings.sizes[0])
  ctx.pdf.text("Contents", ctx.margin, ctx.yPosition)
  ctx.yPosition += ctx.theme.headings.sizes[0] * 0.5

  ctx.pdf.setFont(ctx.bodyFontName, "normal")
  ctx.pdf.setFontSize(ctx.theme.body.size)
  const dotWidth = ctx.pdf.getTextWidth(".")
  const coverOffset = ctx.settings.coverPage ? 1 : 0
  const tocOffset = 1

  tocLines.forEach((entry, idx) => {
    checkPageBreak(ctx, 6)
    const indent = (entry.level - 1) * 6
    const measuredPage = headingPages[idx] ?? 1
    const adjustedPage = measuredPage + coverOffset + tocOffset
    const titleX = ctx.margin + indent
    const pageStr = String(adjustedPage)
    const pageW = ctx.pdf.getTextWidth(pageStr)
    const pageX = ctx.pageWidth - ctx.margin - pageW
    ctx.pdf.text(entry.text, titleX, ctx.yPosition)
    const titleW = ctx.pdf.getTextWidth(entry.text)
    const dotsStart = titleX + titleW + 2
    const dotsEnd = pageX - 2
    if (dotsEnd > dotsStart) {
      const dotCount = Math.floor((dotsEnd - dotsStart) / dotWidth)
      ctx.pdf.text(".".repeat(Math.max(0, dotCount)), dotsStart, ctx.yPosition)
    }
    ctx.pdf.text(pageStr, pageX, ctx.yPosition)
    ctx.yPosition += 6
  })

  ctx.pdf.addPage()
  ctx.yPosition = ctx.margin
}

function stampPageNumbers(ctx: RenderContext): void {
  if (ctx.settings.pageNumbers === "off") return
  const total = ctx.pdf.getNumberOfPages()
  const skipPage1 = ctx.settings.coverPage
  ctx.pdf.setFont(ctx.bodyFontName, "normal")
  ctx.pdf.setFontSize(9)
  ctx.pdf.setTextColor(120, 120, 120)
  for (let p = 1; p <= total; p++) {
    if (skipPage1 && p === 1) continue
    ctx.pdf.setPage(p)
    const label = String(p)
    const w = ctx.pdf.getTextWidth(label)
    const y = ctx.pageHeight - 8
    const x =
      ctx.settings.pageNumbers === "footer-right"
        ? ctx.pageWidth - ctx.margin - w
        : (ctx.pageWidth - w) / 2
    ctx.pdf.text(label, x, y)
  }
  ctx.pdf.setTextColor(0, 0, 0)
}

function extractCoverTitle(container: HTMLElement): string | null {
  const h1 = container.querySelector("h1")
  return h1?.textContent?.trim() || null
}

export async function exportToPdf(
  element: HTMLElement,
  filename: string,
  settings: ExportSettings = DEFAULT_SETTINGS,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: settings.pageSize.toLowerCase() as "a4" | "letter" | "legal",
  })
  const ctx = makeContext(pdf, settings)

  const tocLines = collectTocLines(element, settings.toc)
  const headingPages = tocLines.length > 0 ? measureHeadingPages(element, settings) : []

  if (settings.coverPage) {
    renderCover(ctx, extractCoverTitle(element))
  }
  if (tocLines.length > 0) {
    renderToc(ctx, tocLines, headingPages)
  }
  renderBody(ctx, element)
  stampPageNumbers(ctx)

  pdf.save(filename)
}

export async function exportHtmlToPdf(
  html: string,
  filename: string = "document.pdf",
  settings: ExportSettings = DEFAULT_SETTINGS,
): Promise<void> {
  // Modern, safer alternative to the prior detached-div + imperative HTML injection.
  // DOMParser produces an inert document we walk without re-rendering.
  const parsed = new DOMParser().parseFromString(html, "text/html")
  const container = parsed.body
  await exportToPdf(container, filename, settings)
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm run test:chromium
git add lib/export/export-pdf.ts
git commit -m "refactor: parameterize PDF export with ExportSettings; switch to DOMParser"
```

### Task 3.6: Refactor `lib/export/export-docx.ts` to accept ExportSettings

**Files:**
- Modify: `lib/export/export-docx.ts`

- [ ] **Step 1: Update imports**

Open `lib/export/export-docx.ts`. Replace the imports block at the top with:

```ts
"use client"

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TableOfContents,
  Footer,
  PageNumber,
  PageOrientation,
} from "docx"
import { saveAs } from "file-saver"
import { marked } from "marked"
import { DEFAULT_SETTINGS, MARGIN_MM, type ExportSettings } from "./themes"
import { extractTocEntries } from "./toc"
```

- [ ] **Step 2: Add helpers**

After the existing `MarkdownToken` interface, add:

```ts
function pageSizeToTwip(size: ExportSettings["pageSize"]) {
  const dims =
    size === "A4"
      ? { width: 210, height: 297 }
      : size === "Letter"
        ? { width: 215.9, height: 279.4 }
        : { width: 215.9, height: 355.6 }
  return {
    width: Math.round(dims.width * 56.6929),
    height: Math.round(dims.height * 56.6929),
    orientation: PageOrientation.PORTRAIT,
  }
}

function marginToTwip(mm: number): number {
  return Math.round(mm * 56.6929)
}
```

- [ ] **Step 3: Replace `exportToDocx`**

Replace the existing `exportToDocx` function with:

```ts
export async function exportToDocx(
  markdown: string,
  filename: string = "document.docx",
  settings: ExportSettings = DEFAULT_SETTINGS,
): Promise<void> {
  const tokens = marked.lexer(markdown)
  const bodyChildren: DocxChild[] = []

  if (settings.coverPage) {
    const h1 = tokens.find(
      (t) => (t as MarkdownToken).type === "heading" && (t as MarkdownToken).depth === 1,
    ) as MarkdownToken | undefined
    const title = h1?.text || "Document"
    bodyChildren.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: title, bold: true, size: 72 })],
        spacing: { before: 4000, after: 200 },
      }),
    )
  }

  if (settings.toc !== "off") {
    const tocEntries = extractTocEntries(markdown, settings.toc)
    if (tocEntries.length > 0) {
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "Contents", bold: true })],
        }),
      )
      bodyChildren.push(
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: settings.toc === "h1-h2" ? "1-2" : "1-3",
        }),
      )
    }
  }

  for (const token of tokens) {
    const elements = tokenToDocxElements(token as MarkdownToken)
    bodyChildren.push(...elements)
  }

  const marginMm = MARGIN_MM[settings.margin]
  const sectionProps = {
    page: {
      size: pageSizeToTwip(settings.pageSize),
      margin: {
        top: marginToTwip(marginMm),
        right: marginToTwip(marginMm),
        bottom: marginToTwip(marginMm),
        left: marginToTwip(marginMm),
      },
    },
  }

  const footers =
    settings.pageNumbers !== "off"
      ? {
          default: new Footer({
            children: [
              new Paragraph({
                alignment:
                  settings.pageNumbers === "footer-right"
                    ? AlignmentType.RIGHT
                    : AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT] })],
              }),
            ],
          }),
        }
      : undefined

  const doc = new Document({
    sections: [
      {
        properties: sectionProps,
        children: bodyChildren,
        ...(footers ? { footers } : {}),
      },
    ],
  })

  const buffer = await Packer.toBlob(doc)
  saveAs(buffer, filename)
}
```

(Keep the existing helper functions `tokenToDocxElements`, `createHeading`, `createParagraph`, etc. unchanged. They still operate on `MarkdownToken` and produce `DocxChild`.)

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm run test:chromium
git add lib/export/export-docx.ts
git commit -m "refactor: parameterize DOCX export with ExportSettings, TOC, page numbers, cover"
```

### Task 3.7: Add prose theme variants to `globals.css`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append theme CSS**

Open `app/globals.css` and append at the bottom:

```css
/* Theme variants for Markdown preview */
.prose.prose-github {
  /* baseline already matches GitHub aesthetic */
}

.prose.prose-academic {
  font-family: 'Times New Roman', Times, serif;
  font-size: 0.9375rem;
  line-height: 1.8;
}

.prose.prose-academic h1,
.prose.prose-academic h2,
.prose.prose-academic h3 {
  font-family: 'Times New Roman', Times, serif;
}

.prose.prose-academic p {
  text-indent: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.prose.prose-academic p:first-of-type,
.prose.prose-academic h1 + p,
.prose.prose-academic h2 + p,
.prose.prose-academic h3 + p {
  text-indent: 0;
}

.prose.prose-minimal {
  font-family: var(--font-sans, system-ui), sans-serif;
  font-size: 0.875rem;
  line-height: 1.9;
}

.prose.prose-minimal code {
  background-color: transparent;
  border: 1px solid var(--border);
}

.prose.prose-minimal pre {
  background-color: transparent;
  border: 1px solid var(--border);
}

.prose.prose-minimal hr {
  border-top: 1px dashed var(--border);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add academic and minimal prose theme variants"
```

### Task 3.8: Create `ExportSettingsDialog` and wire it in

**Files:**
- Create: `components/export/export-settings-dialog.tsx`
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Write the dialog**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/export/export-settings-dialog.tsx`:

```tsx
"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  ExportSettings,
  PageSize,
  MarginPreset,
  ThemeId,
  FontFamily,
  HeadingFontFamily,
  TocDepth,
  PageNumbers,
} from "@/lib/export/themes"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ExportSettings
  onChange: (partial: Partial<ExportSettings>) => void
  onReset: () => void
}

function RadioGroup<T extends string>({
  testIdPrefix,
  value,
  onChange,
  options,
}: {
  testIdPrefix: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? "secondary" : "outline"}
          size="sm"
          data-testid={`${testIdPrefix}-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={cn("h-8")}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

export function ExportSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
  onReset,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Export settings</AlertDialogTitle>
          <AlertDialogDescription>
            Tune how your PDF/DOCX is generated. Preview is approximate; PDF output may differ slightly.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Page</Label>
            <RadioGroup<PageSize>
              testIdPrefix="opt-pagesize"
              value={settings.pageSize}
              onChange={(v) => onChange({ pageSize: v })}
              options={[
                { value: "A4", label: "A4" },
                { value: "Letter", label: "Letter" },
                { value: "Legal", label: "Legal" },
              ]}
            />
            <RadioGroup<MarginPreset>
              testIdPrefix="opt-margin"
              value={settings.margin}
              onChange={(v) => onChange({ margin: v })}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "normal", label: "Normal" },
                { value: "wide", label: "Wide" },
              ]}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Typography</Label>
            <RadioGroup<ThemeId>
              testIdPrefix="opt-theme"
              value={settings.theme}
              onChange={(v) => onChange({ theme: v })}
              options={[
                { value: "github", label: "GitHub" },
                { value: "academic", label: "Academic" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Body font</Label>
                <Select
                  value={settings.bodyFont}
                  onValueChange={(v) => onChange({ bodyFont: v as FontFamily })}
                >
                  <SelectTrigger data-testid="opt-bodyfont"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heading font</Label>
                <Select
                  value={settings.headingFont}
                  onValueChange={(v) => onChange({ headingFont: v as HeadingFontFamily })}
                >
                  <SelectTrigger data-testid="opt-headingfont"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match body</SelectItem>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Extras</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Table of contents</Label>
                <Select value={settings.toc} onValueChange={(v) => onChange({ toc: v as TocDepth })}>
                  <SelectTrigger data-testid="opt-toc"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="h1-h2">H1–H2</SelectItem>
                    <SelectItem value="h1-h3">H1–H3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page numbers</Label>
                <Select
                  value={settings.pageNumbers}
                  onValueChange={(v) => onChange({ pageNumbers: v as PageNumbers })}
                >
                  <SelectTrigger data-testid="opt-pagenums"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="footer-center">Footer center</SelectItem>
                    <SelectItem value="footer-right">Footer right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="cover-page"
                type="checkbox"
                data-testid="opt-coverpage"
                checked={settings.coverPage}
                onChange={(e) => onChange({ coverPage: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="cover-page" className="text-sm">
                Include cover page (uses first H1 as title)
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex items-center justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={onReset} data-testid="opt-reset">
            Reset to defaults
          </Button>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Wire into `markdown-converter.tsx`**

Add imports:

```tsx
import { Settings as SettingsIcon } from "lucide-react"
import { useExportSettings } from "@/hooks/use-export-settings"
import { ExportSettingsDialog } from "@/components/export/export-settings-dialog"
```

Add state inside the component:

```tsx
  const { settings: exportSettings, update: updateSettings, reset: resetSettings } = useExportSettings()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
```

Update `handleExport` to pass `exportSettings`:

```tsx
      if (format === "pdf") {
        await exportHtmlToPdf(html, `${exportFilename}.pdf`, exportSettings)
      } else {
        await exportToDocx(markdown, `${exportFilename}.docx`, exportSettings)
      }
```

Pass theme to preview:

```tsx
              <MarkdownPreview html={html} innerRef={previewRef} theme={exportSettings.theme} />
```

Add `rightSlot` to the existing `<EditorToolbar>`:

```tsx
              rightSlot={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  aria-label="Export settings"
                  title="Export settings"
                  data-testid="tb-settings"
                  onClick={() => setSettingsOpen(true)}
                >
                  <SettingsIcon className="size-4" />
                </Button>
              }
```

Mount the dialog at the bottom of the return tree:

```tsx
      <ExportSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={exportSettings}
        onChange={updateSettings}
        onReset={resetSettings}
      />
```

- [ ] **Step 3: Write failing e2e test**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/export-settings.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Export settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('settings dialog opens and theme changes preview class', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await expect(page.locator('text=Export settings')).toBeVisible()

    await page.locator('[data-testid="opt-theme-academic"]').click()
    await page.getByRole('button', { name: 'Done' }).click()

    await expect(page.locator('[data-testid="markdown-preview"]')).toHaveClass(/prose-academic/)
  })

  test('settings persist across reload', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await page.locator('[data-testid="opt-pagesize-Letter"]').click()
    await page.getByRole('button', { name: 'Done' }).click()

    await page.reload()
    await page.locator('[data-testid="tb-settings"]').click()
    await expect(page.locator('[data-testid="opt-pagesize-Letter"]')).toHaveClass(/bg-secondary/)
  })

  test('reset restores defaults', async ({ page }) => {
    await page.locator('[data-testid="tb-settings"]').click()
    await page.locator('[data-testid="opt-theme-minimal"]').click()
    await page.locator('[data-testid="opt-reset"]').click()
    await expect(page.locator('[data-testid="opt-theme-github"]')).toHaveClass(/bg-secondary/)
  })
})
```

- [ ] **Step 4: Run and commit**

```bash
npx playwright test e2e/export-settings.spec.ts --project=chromium
npx tsc --noEmit && npm run lint
git add components/export/export-settings-dialog.tsx components/markdown-converter.tsx e2e/export-settings.spec.ts
git commit -m "feat: add export settings dialog with persistence"
```

### Task 3.9: Phase 3 verification

- [ ] **Step 1: Full lint + typecheck + build + e2e**

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all succeed.

- [ ] **Step 2: Manual smoke**

```bash
npm run dev
```

In browser: open settings, switch theme to Academic, type content, export PDF, verify body uses serif. Switch to Minimal + Wide margin, export DOCX, verify in Word.

- [ ] **Step 3: No commit; checkpoint**
