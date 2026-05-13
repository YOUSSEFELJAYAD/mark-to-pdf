"use client"

import jsPDF from 'jspdf'

// Convert markdown HTML to PDF without html2canvas (which doesn't support OKLCH)
export async function exportToPdf(
  element: HTMLElement,
  filename: string = 'document.pdf'
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Get text content and basic structure
  const content = element.cloneNode(true) as HTMLElement

  // Process each child element
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        addText(text, 'normal', 11)
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tagName = el.tagName.toLowerCase()

    switch (tagName) {
      case 'h1':
        addText(el.textContent || '', 'bold', 24)
        yPosition += 4
        break
      case 'h2':
        yPosition += 4
        addText(el.textContent || '', 'bold', 18)
        yPosition += 2
        break
      case 'h3':
        yPosition += 3
        addText(el.textContent || '', 'bold', 14)
        yPosition += 2
        break
      case 'h4':
      case 'h5':
      case 'h6':
        yPosition += 2
        addText(el.textContent || '', 'bold', 12)
        yPosition += 1
        break
      case 'p':
        addText(el.textContent || '', 'normal', 11)
        yPosition += 2
        break
      case 'ul':
      case 'ol':
        const items = el.querySelectorAll(':scope > li')
        items.forEach((li, index) => {
          const bullet = tagName === 'ol' ? `${index + 1}. ` : '• '
          addText(bullet + (li.textContent || ''), 'normal', 11, margin + 5)
        })
        yPosition += 2
        break
      case 'pre':
        yPosition += 2
        pdf.setFillColor(244, 244, 244)
        const codeText = el.textContent || ''
        const codeLines = pdf.splitTextToSize(codeText, contentWidth - 10)
        const codeHeight = codeLines.length * 5 + 6
        pdf.rect(margin, yPosition - 2, contentWidth, codeHeight, 'F')
        pdf.setFont('courier', 'normal')
        pdf.setFontSize(9)
        codeLines.forEach((line: string) => {
          checkPageBreak(5)
          pdf.text(line, margin + 5, yPosition)
          yPosition += 5
        })
        pdf.setFont('helvetica', 'normal')
        yPosition += 4
        break
      case 'blockquote':
        yPosition += 2
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(1)
        const quoteText = el.textContent || ''
        const quoteLines = pdf.splitTextToSize(quoteText, contentWidth - 15)
        pdf.line(margin + 2, yPosition - 2, margin + 2, yPosition + quoteLines.length * 5)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(100, 100, 100)
        quoteLines.forEach((line: string) => {
          checkPageBreak(5)
          pdf.text(line, margin + 8, yPosition)
          yPosition += 5
        })
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        yPosition += 4
        break
      case 'hr':
        yPosition += 4
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.5)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 6
        break
      case 'code':
        // Inline code - handled within text
        break
      case 'table':
        renderTable(el)
        break
      default:
        // Process children for other elements
        el.childNodes.forEach(processNode)
    }
  }

  const addText = (text: string, style: 'normal' | 'bold' | 'italic', size: number, xOffset = margin) => {
    pdf.setFont('helvetica', style)
    pdf.setFontSize(size)
    pdf.setTextColor(0, 0, 0)

    const lines = pdf.splitTextToSize(text, contentWidth - (xOffset - margin))
    lines.forEach((line: string) => {
      checkPageBreak(size * 0.4)
      pdf.text(line, xOffset, yPosition)
      yPosition += size * 0.45
    })
  }

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }
  }

  const renderTable = (table: HTMLElement) => {
    const rows = table.querySelectorAll('tr')
    if (rows.length === 0) return

    yPosition += 4
    const cellPadding = 3
    const rowHeight = 8

    rows.forEach((row, rowIndex) => {
      checkPageBreak(rowHeight)
      const cells = row.querySelectorAll('th, td')
      const cellWidth = contentWidth / cells.length

      cells.forEach((cell, cellIndex) => {
        const x = margin + cellIndex * cellWidth
        const isHeader = cell.tagName.toLowerCase() === 'th'

        if (isHeader) {
          pdf.setFillColor(230, 230, 230)
          pdf.rect(x, yPosition - 5, cellWidth, rowHeight, 'F')
        }

        pdf.setDrawColor(200, 200, 200)
        pdf.rect(x, yPosition - 5, cellWidth, rowHeight, 'S')

        pdf.setFont('helvetica', isHeader ? 'bold' : 'normal')
        pdf.setFontSize(9)
        pdf.text(cell.textContent || '', x + cellPadding, yPosition)
      })

      yPosition += rowHeight
    })
    yPosition += 4
  }

  // Process all content
  content.childNodes.forEach(processNode)

  pdf.save(filename)
}

// Export markdown HTML directly to PDF
export async function exportHtmlToPdf(
  html: string,
  filename: string = 'document.pdf'
): Promise<void> {
  const container = document.createElement('div')
  container.innerHTML = html

  await exportToPdf(container, filename)
}
