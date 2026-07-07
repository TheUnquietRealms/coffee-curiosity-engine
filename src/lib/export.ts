import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx'
import { jsPDF } from 'jspdf'
import type { Article } from '../types'

export async function exportDocx(article: Article): Promise<void> {
  const bodyParas = article.body
    .split(/\n\n+/)
    .filter(Boolean)
    .map(text => new Paragraph({ children: [new TextRun({ text, size: 24 })] }))

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: article.title || 'Untitled', heading: HeadingLevel.HEADING_1 }),
        ...(article.subtitle ? [new Paragraph({
          children: [new TextRun({ text: article.subtitle, italics: true, size: 24 })],
        })] : []),
        new Paragraph({ text: '' }),
        ...bodyParas,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(article.title || 'article').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.docx`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportPdf(article: Article): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 72
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const writeLines = (text: string, fontSize: number, lineHeight: number, opts: { bold?: boolean; italic?: boolean } = {}) => {
    doc.setFont('times', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal')
    doc.setFontSize(fontSize)
    const lines: string[] = doc.splitTextToSize(text, maxWidth)
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, margin, y)
      y += lineHeight
    }
  }

  writeLines(article.title || 'Untitled', 22, 28, { bold: true })
  if (article.subtitle) {
    y += 4
    writeLines(article.subtitle, 13, 18, { italic: true })
  }
  y += 20

  const paragraphs = article.body.split(/\n\n+/).filter(Boolean)
  for (const para of paragraphs) {
    writeLines(para, 12, 17)
    y += 12
  }

  doc.save(`${(article.title || 'article').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
}
