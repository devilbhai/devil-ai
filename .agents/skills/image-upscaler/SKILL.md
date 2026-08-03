---
name: image-upscaler
description: Image upscaling. Super-resolution, quality enhancement, format conversion.
---

# Image Upscaler

## When to Apply

- When building image upscaling features
- When implementing super-resolution models
- When creating quality enhancement or restoration tools
- When working with low-resolution or compressed images

## Core Concepts

- **Super-Resolution**: AI-based upscaling beyond original resolution
- **Denoising**: Remove compression artifacts and noise
- **Sharpening**: Enhance edge detail after upscaling
- **Format Conversion**: Maintain quality across format changes
- **Batch Upscaling**: Process multiple images efficiently

## Implementation

```ts
// Upscaling configuration
interface UpscaleConfig {
  scaleFactor: 2 | 4 | 8 // multiplier
  model: "esrgan" | "real-esrgan" | "swinir" | "lanczos"
  denoise: boolean
  denoiseStrength: number // 0-1
  sharpen: boolean
  sharpenAmount: number // 0-1
  outputFormat: "png" | "jpg" | "webp"
  outputQuality?: number // 1-100 for lossy formats
}

// Upscaling result
interface UpscaleResult {
  original: { url: string; width: number; height: number }
  upscaled: { url: string; width: number; height: number }
  model: string
  scaleFactor: number
  processingTime: number
  qualityScore?: number
}

// Quality assessment
interface QualityMetrics {
  psnr: number // peak signal-to-noise ratio
  ssim: number // structural similarity
  sharpness: number
  artifactScore: number
}
```

```ts
// Upscale image
async function upscaleImage(
  imageUrl: string,
  config: UpscaleConfig
): Promise<UpscaleResult> {
  const image = await loadImage(imageUrl)
  
  let result: ImageData = image
  
  if (config.denoise) {
    result = await denoiseImage(result, config.denoiseStrength)
  }
  
  result = await superResolutionUpscale(result, config.model, config.scaleFactor)
  
  if (config.sharpen) {
    result = await sharpenImage(result, config.sharpenAmount)
  }
  
  const outputUrl = await saveImage(result, config.outputFormat, config.outputQuality)
  
  return {
    original: { url: imageUrl, width: image.width, height: image.height },
    upscaled: { url: outputUrl, width: result.width, height: result.height },
    model: config.model,
    scaleFactor: config.scaleFactor,
    processingTime: elapsed(),
  }
}
```

## Best Practices

- Use AI models (Real-ESRGAN) for photorealistic upscaling
- Apply denoising before upscaling to avoid amplifying artifacts
- Use Lanczos for quick, non-AI upscaling where quality is less critical
- Preserve aspect ratio by default
- Support region-of-interest upscaling for large images
- Cache upscaling models to reduce cold start time
- Provide quality comparison between original and upscaled
- Support progressive loading for large output images
