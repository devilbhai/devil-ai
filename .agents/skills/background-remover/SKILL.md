---
name: background-remover
description: Background removal. Segmentation, masking, clean extraction.
---

# Background Remover

## When to Apply

- When building background removal features
- When implementing image segmentation for extraction
- When creating masking or matting tools
- When working with e-commerce product photos or profile pictures

## Core Concepts

- **Image Segmentation**: Separate foreground from background at pixel level
- **Alpha Matting**: Refine edges with transparency for hair/fur
- **Semantic Segmentation**: Classify each pixel by content type
- **Background Replacement**: Swap backgrounds after removal
- **Batch Processing**: Handle multiple images efficiently

## Implementation

```ts
// Background removal result
interface BackgroundRemovalResult {
  original: string // original image URL
  masked: string // image with transparent background
  mask: string // mask image (white = foreground)
  confidence: number // overall quality score
  processingTime: number
}

// Removal configuration
interface RemovalConfig {
  model: "u2net" | "modnet" | "isnet" | "sam"
  refineEdges: boolean
  featherRadius: number
  outputFormat: "png" | "webp"
  background?: {
    type: "transparent" | "solid" | "blur"
    color?: string
    blurRadius?: number
  }
  threshold?: number // foreground confidence threshold
}

// Segmentation mask
interface SegmentationMask {
  width: number
  height: number
  data: Uint8Array // per-pixel confidence 0-255
  format: "rgba" | "luminance"
}
```

```ts
// Remove background
async function removeBackground(
  imageUrl: string,
  config: RemovalConfig
): Promise<BackgroundRemovalResult> {
  const image = await loadImage(imageUrl)
  const mask = await segmentForeground(image, config.model)
  
  const refinedMask = config.refineEdges
    ? await refineEdges(mask, config.featherRadius)
    : mask

  const result = applyMask(image, refinedMask)
  
  if (config.background) {
    return await replaceBackground(result, config.background)
  }
  
  return { original: imageUrl, masked: result, mask: refinedMask, confidence: calculateConfidence(refinedMask), processingTime: elapsed() }
}
```

## Best Practices

- Use GPU acceleration for real-time background removal
- Apply edge refinement for clean extraction of complex edges
- Support both transparent and replacement backgrounds
- Handle complex edges (hair, fur, transparent objects) with matting
- Provide confidence scores for quality assessment
- Allow manual mask editing for critical use cases
- Optimize output file size for transparent PNGs
- Cache segmentation models to reduce cold start latency
