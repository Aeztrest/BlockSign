import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function exportToPDF(contractText: string, title = "Sözleşme"): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 12
    const margin = 50
    const lineHeight = fontSize * 1.2

    // Title
    page.drawText(title, {
      x: margin,
      y: height - margin,
      size: 18,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    })

    // Content
    const lines = contractText.split("\n")
    let yPosition = height - margin - 40

    for (const line of lines) {
      if (yPosition < margin) {
        // Add new page if needed
        const newPage = pdfDoc.addPage()
        yPosition = newPage.getSize().height - margin
      }

      // Handle markdown headers
      if (line.startsWith("# ")) {
        page.drawText(line.substring(2), {
          x: margin,
          y: yPosition,
          size: 16,
          font: timesRomanBoldFont,
          color: rgb(0, 0, 0),
        })
      } else if (line.startsWith("## ")) {
        page.drawText(line.substring(3), {
          x: margin,
          y: yPosition,
          size: 14,
          font: timesRomanBoldFont,
          color: rgb(0, 0, 0),
        })
      } else {
        // Regular text with word wrapping
        const words = line.split(" ")
        let currentLine = ""

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word
          const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize)

          if (textWidth > width - 2 * margin && currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            })
            yPosition -= lineHeight
            currentLine = word
          } else {
            currentLine = testLine
          }
        }

        if (currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          })
        }
      }

      yPosition -= lineHeight
    }

    return await pdfDoc.save()
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error("PDF oluşturulurken hata oluştu")
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename = "sozlesme.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
