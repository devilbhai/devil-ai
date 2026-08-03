---
name: ai-vision
description: Computer vision. Image analysis, object detection, visual understanding.
---

# AI Vision

## When to Apply

- When building or modifying computer vision features
- When implementing image analysis or visual understanding
- When creating object detection or classification tools
- When working with image-based search or content moderation

## Core Concepts

- **Image Classification**: Categorize images into predefined classes
- **Object Detection**: Locate and identify objects within images
- **Image Segmentation**: Pixel-level classification of image regions
- **Visual Understanding**: Scene description, relationship detection
- **OCR**: Extract text from images and documents

## Implementation

```ts
// Vision analysis result
interface VisionResult {
  imageId: string
  classifications: { label: string; confidence: number }[]
  objects: DetectedObject[]
  text?: string // OCR output
  description?: string // scene description
  metadata: { width: number; height: number; format: string }
}

// Detected object
interface DetectedObject {
  label: string
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
  attributes?: Record<string, string>
}

// Image preprocessing options
interface PreprocessOptions {
  resize?: { width: number; height: number }
  normalize?: boolean
  grayscale?: boolean
  enhance?: { brightness?: number; contrast?: number }
}
```

```ts
// Analyze image
async function analyzeImage(
  imageUrl: string,
  options: { detectObjects: boolean; classify: boolean; ocr: boolean }
): Promise<VisionResult> {
  const image = await loadImage(imageUrl)
  const preprocessed = preprocessImage(image, options.preprocess)
  
  const results: VisionResult = { imageId: generateId(), objects: [], classifications: [], metadata: getImageMeta(image) }
  
  if (options.classify) {
    results.classifications = await classifier.predict(preprocessed)
  }
  if (options.detectObjects) {
    results.objects = await detector.detect(preprocessed)
  }
  if (options.ocr) {
    results.text = await ocrEngine.extractText(preprocessed)
  }
  return results
}
```

## Best Practices

- Preprocess images consistently (resize, normalize) before inference
- Use confidence thresholds to filter low-quality predictions
- Batch processing for multiple images to improve throughput
- Cache model loading to avoid reloading for each request
- Handle various image formats and edge cases (rotated, low-res)
- Use appropriate models for the task (classification vs detection vs segmentation)
- Implement fallback mechanisms when primary model fails
- Log inference metrics for performance monitoring
