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
