// lib/pdf.ts  (veya exportToPDF.ts)
import { PDFDocument, rgb } from "pdf-lib";

async function loadEmbeddedFont(pdfDoc: PDFDocument) {
  // Try to load a unicode TTF from public folder
  try {
    const fontUrl = "/fonts/NotoSans-Regular.ttf";
    const resp = await fetch(fontUrl);
    if (!resp.ok) throw new Error("Font fetch failed: " + resp.status);
    const fontBytes = await resp.arrayBuffer();
    return await pdfDoc.embedFont(fontBytes);
  } catch (err) {
    console.warn("[exportToPDF] Unicode font load failed, falling back to StandardFonts (may break local chars):", err);
    // fallback to a standard font (may not support Turkish chars)
    return await pdfDoc.embedFont(PDFDocument.PDF_NAME ? (undefined as any) : (undefined as any)); // placeholder - we'll embed later
  }
}

// Word wrap util: returns array of lines that fit maxWidth.
// If a single word is longer than maxWidth, it breaks it by character.
function wrapTextToLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const outLines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      outLines.push("");
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const candidate = line ? line + " " + w : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        line = candidate;
      } else {
        if (line) outLines.push(line);
        // If single word itself is too long, split it by characters
        if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            const test = chunk + ch;
            if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
              if (chunk) outLines.push(chunk);
              chunk = ch;
            } else {
              chunk = test;
            }
          }
          if (chunk) {
            line = chunk; // continue with rest words
          } else {
            line = "";
          }
        } else {
          line = w;
        }
      }
    }
    if (line) outLines.push(line);
  }

  return outLines;
}

export async function exportToPDF(contractText: string, title = "Sözleşme"): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();

    // Try to embed Unicode font from public/fonts
    let font: any = null;
    try {
      const fontUrl = "/fonts/NotoSans-Regular.ttf";
      const fResp = await fetch(fontUrl);
      if (!fResp.ok) throw new Error("Font not found at " + fontUrl);
      const fontBytes = await fResp.arrayBuffer();
      font = await pdfDoc.embedFont(fontBytes);
    } catch (e) {
      console.warn("[exportToPDF] Unicode font embed failed, will try StandardFonts (non-Unicode)", e);
      // fallback to a standard font (may fail on Turkish chars)
      font = await pdfDoc.embedFont((await import("pdf-lib")).StandardFonts.Helvetica);
    }

    const pageSize = { width: 595.28, height: 841.89 }; // A4 in points
    let page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    let { width, height } = page.getSize();

    const margin = 48;
    const fontSize = 11;
    const lineHeight = fontSize * 1.35;
    const maxWidth = width - margin * 2;

    // Title
    const titleSize = 16;
    page.drawText(title, {
      x: margin,
      y: height - margin,
      size: titleSize,
      font,
      color: rgb(0, 0, 0),
    });

    let yPosition = height - margin - titleSize - 12;

    // Normalize contractText: ensure consistent newlines
    const normalized = contractText.replace(/\r/g, "");
    // We will process line-by-line but with wrapping
    const rawLines = normalized.split("\n");

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];

      // Convert markdown headings to visible heading lines
      let isHeading = false;
      let headingSize = fontSize;
      if (line.startsWith("# ")) {
        line = line.replace(/^#\s*/, "").trim();
        isHeading = true;
        headingSize = 14;
      } else if (line.startsWith("## ")) {
        line = line.replace(/^##\s*/, "").trim();
        isHeading = true;
        headingSize = 12.5;
      } else if (line.startsWith("### ")) {
        line = line.replace(/^###\s*/, "").trim();
        isHeading = true;
        headingSize = 11.5;
      }

      // If empty line -> add spacing
      if (!line.trim()) {
        yPosition -= lineHeight / 2;
      } else {
        // Wrap the line according to available width
        const linesToDraw = wrapTextToLines(line, font, isHeading ? headingSize : fontSize, maxWidth);

        for (const outLine of linesToDraw) {
          // if not enough space on the page, create a new one and switch page reference
          if (yPosition - lineHeight < margin) {
            page = pdfDoc.addPage([pageSize.width, pageSize.height]);
            width = page.getSize().width;
            height = page.getSize().height;
            yPosition = height - margin;
          }

          page.drawText(outLine, {
            x: margin,
            y: yPosition,
            size: isHeading ? headingSize : fontSize,
            font,
            color: rgb(0, 0, 0),
          });

          yPosition -= lineHeight;
        }
      }
    }

    const bytes = await pdfDoc.save();
    return bytes;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("PDF oluşturulurken hata oluştu: " + String(error));
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename = "sozlesme.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
