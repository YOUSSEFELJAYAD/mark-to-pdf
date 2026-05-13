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
} from 'docx'
import { saveAs } from 'file-saver'
import { marked } from 'marked'

type DocxChild = Paragraph | Table

interface MarkdownToken {
  type: string
  raw: string
  text?: string
  depth?: number
  items?: MarkdownToken[]
  tokens?: MarkdownToken[]
  ordered?: boolean
  href?: string
  lang?: string
  header?: MarkdownToken[][]
  rows?: MarkdownToken[][]
  cells?: MarkdownToken[]
}

export async function exportToDocx(
  markdown: string,
  filename: string = 'document.docx'
): Promise<void> {
  const tokens = marked.lexer(markdown)
  const children: DocxChild[] = []

  for (const token of tokens) {
    const elements = tokenToDocxElements(token as MarkdownToken)
    children.push(...elements)
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const buffer = await Packer.toBlob(doc)
  saveAs(buffer, filename)
}

function tokenToDocxElements(token: MarkdownToken): DocxChild[] {
  switch (token.type) {
    case 'heading':
      return [createHeading(token.text || '', token.depth || 1)]

    case 'paragraph':
      return [createParagraph(token.tokens || [], token.text || '')]

    case 'list':
      return createList(token)

    case 'code':
      return [createCodeBlock(token.text || '', token.lang)]

    case 'blockquote':
      return createBlockquote(token)

    case 'table':
      return [createTable(token)]

    case 'hr':
      return [createHorizontalRule()]

    case 'space':
      return [new Paragraph({ children: [] })]

    default:
      if (token.text) {
        return [new Paragraph({ children: [new TextRun(token.text)] })]
      }
      return []
  }
}

function createHeading(text: string, depth: number): Paragraph {
  const headingLevels: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  }

  return new Paragraph({
    heading: headingLevels[depth] || HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: depth <= 2 })],
  })
}

function createParagraph(tokens: MarkdownToken[], fallbackText: string): Paragraph {
  if (!tokens || tokens.length === 0) {
    return new Paragraph({
      children: [new TextRun(fallbackText)],
    })
  }

  const children: (TextRun | ExternalHyperlink)[] = []

  for (const token of tokens) {
    const runs = tokenToTextRuns(token)
    children.push(...runs)
  }

  return new Paragraph({ children })
}

function tokenToTextRuns(token: MarkdownToken): (TextRun | ExternalHyperlink)[] {
  switch (token.type) {
    case 'text':
      return [new TextRun(token.text || '')]

    case 'strong':
      return [
        new TextRun({
          text: getTextContent(token),
          bold: true,
        }),
      ]

    case 'em':
      return [
        new TextRun({
          text: getTextContent(token),
          italics: true,
        }),
      ]

    case 'codespan':
      return [
        new TextRun({
          text: token.text || '',
          font: 'Courier New',
          shading: { fill: 'E0E0E0' },
        }),
      ]

    case 'link':
      return [
        new ExternalHyperlink({
          link: token.href || '',
          children: [
            new TextRun({
              text: getTextContent(token),
              style: 'Hyperlink',
            }),
          ],
        }),
      ]

    case 'br':
      return [new TextRun({ break: 1 })]

    default:
      if (token.text) {
        return [new TextRun(token.text)]
      }
      return []
  }
}

function getTextContent(token: MarkdownToken): string {
  if (token.text) return token.text
  if (token.tokens) {
    return token.tokens.map(t => getTextContent(t)).join('')
  }
  return ''
}

function createList(token: MarkdownToken): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const items = token.items || []

  items.forEach((item, index) => {
    const text = getTextContent(item)
    const bullet = token.ordered ? `${index + 1}. ` : '• '

    paragraphs.push(
      new Paragraph({
        children: [new TextRun(bullet + text)],
        indent: { left: 720 }, // 0.5 inch
      })
    )
  })

  return paragraphs
}

function createCodeBlock(text: string, lang?: string): Paragraph {
  const lines = text.split('\n')
  const children: TextRun[] = []

  lines.forEach((line, index) => {
    children.push(
      new TextRun({
        text: line,
        font: 'Courier New',
        size: 20, // 10pt
      })
    )
    if (index < lines.length - 1) {
      children.push(new TextRun({ break: 1 }))
    }
  })

  return new Paragraph({
    children,
    shading: { fill: 'F4F4F4' },
    spacing: { before: 200, after: 200 },
  })
}

function createBlockquote(token: MarkdownToken): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const tokens = token.tokens || []

  for (const t of tokens) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: getTextContent(t),
            italics: true,
          }),
        ],
        indent: { left: 720 },
        border: {
          left: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: 'CCCCCC',
          },
        },
      })
    )
  }

  return paragraphs
}

function createTable(token: MarkdownToken): Table {
  const headerRow = token.header || []
  const rows = token.rows || []

  const tableRows: TableRow[] = []

  // Header row
  if (headerRow.length > 0) {
    const headerCells = headerRow.map(
      (cell) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: Array.isArray(cell) ? cell.map(c => getTextContent(c)).join('') : getTextContent(cell),
                  bold: true,
                }),
              ],
            }),
          ],
          shading: { fill: 'E0E0E0' },
        })
    )
    tableRows.push(new TableRow({ children: headerCells }))
  }

  // Data rows
  for (const row of rows) {
    const cells = (Array.isArray(row) ? row : [row]).map(
      (cell) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun(Array.isArray(cell) ? cell.map(c => getTextContent(c)).join('') : getTextContent(cell)),
              ],
            }),
          ],
        })
    )
    tableRows.push(new TableRow({ children: cells }))
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

function createHorizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: 'CCCCCC',
      },
    },
    spacing: { before: 400, after: 400 },
    children: [],
  })
}
