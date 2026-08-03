---
name: ocr-processing
description: OCR (Optical Character Recognition). Covers Tesseract.js, image preprocessing, text detection, multi-language support, handwriting recognition.
---

# OCR (Optical Character Recognition)

## When to Apply
- Extracting text from scanned documents
- Reading text from images (screenshots, photos)
- Multi-language text recognition
- Preprocessing images for better OCR accuracy

## Core Concepts
- **Tesseract.js**: JavaScript OCR engine (WebAssembly-based)
- **Preprocessing**: Grayscale, contrast, threshold, denoise
- **Text detection**: Finding text regions before recognition
- **Language packs**: Support for multiple languages
- **Confidence scoring**: Measuring OCR reliability per word

## Implementation

### Basic OCR
```ts
import Tesseract from "esseract.js"

async function ocrImage(imagePath: string): Promise<string> {
  const { data } = await Tesseract.recognize(imagePath, "eng")
  return data.text
}
```

### OCR with Confidence
```ts
async function ocrWithConfidence(imagePath: string, minConfidence = 70) {
  const { data } = await Tesseract.recognize(imagePath, "eng")
  return data.words
    .filter((w) => w.confidence >= minConfidence)
    .map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: w.bbox,
    }))
}
```

### Multi-Language OCR
```ts
async function ocrMultiLang(imagePath: string, langs = ["eng", "fra", "deu"]) {
  const langStr = langs.join("+")
  const { data } = await Tesseract.recognize(imagePath, langStr)
  return {
    text: data.text,
    confidence: data.confidence,
  }
}
```

### Image Preprocessing
```ts
import sharp from "sharp"

async function preprocessForOCR(imagePath: string): Promise<Buffer> {
  return sharp(imagePath)
    .grayscale()
    .normalize() // Auto contrast
    .sharpen()
    .threshold(128) // Binary threshold
    .toBuffer()
}
```

### OCR from PDF
```ts
import pdf from "pdf-parse"

async function ocrPDF(pdfPath: string) {
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdf(buffer, {
    // For scanned PDFs, text extraction returns empty
    // Use Tesseract on each page image
  })
  return data.text
}
```

### Worker Pool for Performance
```ts
import { createWorker } from "tesseract.js"

async function ocrBatch(images: string[]) {
  const worker = await createWorker("eng")
  const results = await Promise.all(
    images.map(async (img) => {
      const { data } = await worker.recognize(img)
      return { image: img, text: data.text }
    }),
  )
  await worker.terminate()
  return results
}
```

## Best Practices
- Preprocess images (grayscale, threshold) before OCR
- Set correct language for better accuracy
- Use confidence thresholds to filter garbage output
- Handle rotated text with orientation detection
- Use worker pools for batch processing
- Cache OCR results (same image = same text)
- For complex layouts, detect regions first then OCR each
