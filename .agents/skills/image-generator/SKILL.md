---
name: image-generator
description: AI image generation. Prompt engineering, style control, batch generation.
---

# Image Generator

## When to Apply

- When building AI image generation features
- When implementing prompt engineering or style control
- When creating batch generation or image variation tools
- When working with text-to-image or image-to-image workflows

## Core Concepts

- **Text-to-Image**: Generate images from text prompts (Stable Diffusion, DALL-E, Midjourney)
- **Image-to-Image**: Transform existing images based on prompts
- **Inpainting**: Fill masked regions with generated content
- **ControlNet**: Guide generation with structure/edge maps
- **Prompt Engineering**: Optimize prompts for desired outputs

## Implementation

```ts
// Generation request
interface GenerationRequest {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  steps: number
  cfgScale: number // guidance scale
  seed?: number
  model: string
  scheduler?: string
  batchSize?: number
}

// Generation result
interface GenerationResult {
  id: string
  images: GeneratedImage[]
  prompt: string
  seed: number
  model: string
  generationTime: number
  metadata: Record<string, unknown>
}

interface GeneratedImage {
  url: string
  width: number
  height: number
  format: "png" | "jpg" | "webp"
}

// Style preset
interface StylePreset {
  name: string
  promptSuffix: string
  negativePromptSuffix: string
  cfgScale: number
  steps: number
  scheduler: string
}
```

```ts
// Generate with style preset
async function generateWithStyle(
  request: GenerationRequest,
  style: StylePreset
): Promise<GenerationResult> {
  const enhancedRequest = {
    ...request,
    prompt: `${request.prompt}, ${style.promptSuffix}`,
    negativePrompt: `${request.negativePrompt ?? ""}, ${style.negativePromptSuffix}`,
    cfgScale: style.cfgScale,
    steps: style.steps,
    scheduler: style.scheduler,
  }
  return await generateImage(enhancedRequest)
}

// Batch generation
async function batchGenerate(
  prompts: string[],
  config: GenerationConfig
): Promise<GenerationResult[]> {
  const queue = createQueue(config.concurrency)
  return queue.addAll(prompts.map((p) => () => generateImage({ ...config, prompt: p })))
}
```

## Best Practices

- Use negative prompts to exclude unwanted elements
- Set appropriate CFG scale (7-12 for most models)
- Use consistent seeds for reproducible results
- Implement prompt templates for common styles
- Cache generated images with prompt hashes
- Support multiple samplers for quality/speed tradeoffs
- Validate prompts for content policy compliance
- Use batch processing to amortize model loading costs
