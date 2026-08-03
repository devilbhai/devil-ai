---
name: screenshot-analysis
description: Screenshot analysis and OCR. Covers image comparison, visual regression testing, UI element detection, text extraction from screenshots.
---

# Screenshot Analysis & OCR

## When to Apply
- Extracting text from screenshots or images
- Visual regression testing (comparing UI snapshots)
- Detecting UI elements in screenshots
- Automated visual quality checks

## Core Concepts
- **OCR**: Extracting text from images using Tesseract.js
- **Image comparison**: Pixel-level or structural diff of screenshots
- **Visual regression**: Baseline vs current screenshot comparison
- **UI detection**: Identifying buttons, inputs, text regions

## Implementation

### Text Extraction (Tesseract.js)
```ts
import Tesseract from "tesseract.js"

async function extractText(imagePath: string): Promise<string> {
  const { data } = await Tesseract.recognize(imagePath, "eng")
  return data.text
}

async function extractTextWithBoxes(imagePath: string) {
  const { data } = await Tesseract.recognize(imagePath, "eng")
  return data.words.map((w) => ({
    text: w.text,
    confidence: w.confidence,
    bbox: w.bbox,
  }))
}
```

### Image Comparison
```ts
import { PNG } from "pngjs"
import pixelMatch from "pixelmatch"

function compareImages(img1Path: string, img2Path: string, threshold = 0.1) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path))
  const img2 = PNG.sync.read(fs.readFileSync(img2Path))
  const diff = new PNG({ width: img1.width, height: img1.height })

  const numDiffPixels = pixelMatch(
    img1.data, img2.data, diff.data,
    img1.width, img1.height,
    { threshold },
  )

  return {
    diffPixels: numDiffPixels,
    totalPixels: img1.width * img1.height,
    diffPercent: (numDiffPixels / (img1.width * img1.height)) * 100,
  }
}
```

### Visual Regression with Playwright
```ts
async function visualRegression(page: Page, name: string, threshold = 0.2) {
  const screenshot = await page.screenshot({ fullPage: true })
  const baselinePath = `baselines/${name}.png`
  const currentPath = `current/${name}.png`

  fs.writeFileSync(currentPath, screenshot)

  if (!fs.existsSync(baselinePath)) {
    fs.copyFileSync(currentPath, baselinePath)
    return { status: "baseline-created" }
  }

  const result = compareImages(baselinePath, currentPath, threshold)
  return result.diffPercent > threshold
    ? { status: "failed", diff: result }
    : { status: "passed", diff: result }
}
```

### UI Element Detection
```ts
async function detectElements(imagePath: string) {
  const { data } = await Tesseract.recognize(imagePath, "eng", {
    // Tesseract doesn't detect UI elements natively,
    // combine with contour detection or use OpenCV.js
  })
  return {
    textRegions: data.lines.map((l) => ({
      text: l.text,
      bbox: l.bbox,
      confidence: l.confidence,
    })),
  }
}
```

## Best Practices
- Pre-process images (grayscale, contrast) before OCR
- Set language packs for multi-language text
- Use confidence thresholds to filter low-quality OCR results
- Store baseline screenshots with versioned names
- Run visual regression in CI with artifact upload
- Handle different resolutions/DPIs in comparisons
- Use `--psm` modes in Tesseract for different layouts
