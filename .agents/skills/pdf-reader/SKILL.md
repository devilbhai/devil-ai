---
name: pdf-reader
description: PDF reading and extraction. Covers text extraction, table extraction, image extraction, PDF parsing, metadata extraction.
---

# PDF Reading & Extraction

## When to Apply
- Extracting text content from PDF files
- Pulling tables from PDF documents
- Extracting images embedded in PDFs
- Reading PDF metadata and structure

## Core Concepts
- **Text extraction**: Getting readable text from PDF content streams
- **Table detection**: Identifying tabular structures in PDF layouts
- **Image extraction**: Pulling embedded images from PDF objects
- **Metadata**: Title, author, creation date, page count
- **PDF parsing**: Understanding PDF object structure (pdf-parse, pdf-lib)

## Implementation

### Text Extraction (pdf-parse)
```ts
import pdf from "pdf-parse"

async function extractText(pdfPath: string) {
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdf(buffer)

  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info,
    metadata: data.metadata,
  }
}

async function extractTextByPage(pdfPath: string) {
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdf(buffer)

  // pdf-parse extracts all pages at once; split by page markers
  const pageTexts = data.text.split(/\f/) // form feed character
  return pageTexts.map((text, i) => ({
    page: i + 1,
    text: text.trim(),
  }))
}
```

### Table Extraction
```ts
function extractTables(text: string): string[][][] {
  const lines = text.split("\n")
  const tables: string[][][] = []
  let currentTable: string[][] = []

  for (const line of lines) {
    // Detect table rows (lines with multiple tab/pipe separators)
    if (line.includes("\t") || line.includes("|")) {
      const cells = line.split(/[\t|]/).map((c) => c.trim()).filter(Boolean)
      if (cells.length > 1) {
        currentTable.push(cells)
        continue
      }
    }
    if (currentTable.length > 0) {
      tables.push(currentTable)
      currentTable = []
    }
  }
  if (currentTable.length > 0) tables.push(currentTable)
  return tables
}
```

### Image Extraction
```ts
import { PDFDocument } from "pdf-lib"

async function extractImages(pdfPath: string) {
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()

  // Note: pdf-lib can read pages but image extraction requires
  // parsing raw PDF objects. Use pdf-parse or pdfjs-dist for full extraction.
  return {
    pageCount: pages.length,
    // For full image extraction, use pdfjs-dist:
    // const doc = await pdfjsLib.getDocument(pdfBytes).promise
  }
}
```

### Metadata
```ts
async function getMetadata(pdfPath: string) {
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdf(buffer)
  return data.info // { Title, Author, Creator, Producer, CreationDate, ... }
}
```

## Best Practices
- Handle password-protected PDFs gracefully
- Use `pdf-parse` for quick text extraction, `pdf-lib` for manipulation
- For tables, consider dedicated libraries (tabula, pdf-table-extractor)
- Handle multi-column layouts (text may merge columns)
- Preserve reading order in extracted text
- Handle rotated pages and scanned PDFs (OCR fallback)
- Clean extracted text (remove extra whitespace, fix encoding)
