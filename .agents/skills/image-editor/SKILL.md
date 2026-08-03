---
name: image-editor
description: Image editing automation. Filters, adjustments, compositing, batch processing.
---

# Image Editor

## When to Apply

- When building image editing or manipulation features
- When implementing filter pipelines or adjustments
- When creating compositing or layer-based editing
- When working with batch image processing

## Core Concepts

- **Adjustments**: Brightness, contrast, saturation, hue, exposure
- **Filters**: Blur, sharpen, noise reduction, emboss, vintage
- **Compositing**: Layer blending, masking, alpha compositing
- **Transformations**: Crop, resize, rotate, perspective correction
- **Batch Processing**: Apply operations to multiple images efficiently

## Implementation

```ts
// Image operation pipeline
interface ImagePipeline {
  operations: ImageOperation[]
  outputFormat: "png" | "jpg" | "webp"
  quality?: number
}

interface ImageOperation {
  type: "adjust" | "filter" | "transform" | "composite"
  name: string
  params: Record<string, number | string | boolean>
}

// Adjustment parameters
interface AdjustParams {
  brightness?: number // -100 to 100
  contrast?: number // -100 to 100
  saturation?: number // -100 to 100
  hue?: number // 0 to 360
  exposure?: number // -5 to 5
  gamma?: number // 0.1 to 10
}

// Filter parameters
interface FilterParams {
  radius?: number // for blur/sharpen
  amount?: number // intensity
  threshold?: number // for edge detection
}

// Compositing layer
interface CompositeLayer {
  image: ImageData
  x: number
  y: number
  opacity: number
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten"
  mask?: MaskData
}
```

```ts
// Apply adjustment pipeline
async function processImage(
  input: ImageData,
  pipeline: ImagePipeline
): Promise<ImageData> {
  let result = input
  for (const op of pipeline.operations) {
    switch (op.type) {
      case "adjust":
        result = await applyAdjustment(result, op.name, op.params as AdjustParams)
        break
      case "filter":
        result = await applyFilter(result, op.name, op.params as FilterParams)
        break
      case "transform":
        result = await applyTransform(result, op.name, op.params)
        break
      case "composite":
        result = await composite(result, op.params as unknown as CompositeLayer)
        break
    }
  }
  return result
}
```

## Best Practices

- Use non-destructive editing (store operations, not modified pixels)
- Process images in sRGB color space for web output
- Implement undo/redo with operation history
- Use progressive loading for large images
- Optimize batch processing with parallel execution
- Preserve EXIF data when appropriate
- Support alpha channels throughout the pipeline
- Generate thumbnails separately from full-resolution outputs
