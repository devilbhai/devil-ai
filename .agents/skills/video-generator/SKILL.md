---
name: video-generator
description: AI video generation. Script-to-video, animation, scene composition.
---

# Video Generator

## When to Apply

- When building AI video generation features
- When implementing script-to-video workflows
- When creating animation or motion graphics tools
- When working with video synthesis or scene composition

## Core Concepts

- **Text-to-Video**: Generate video clips from text descriptions
- **Image-to-Video**: Animate still images into video
- **Script-to-Video**: Full pipeline from script to finished video
- **Scene Composition**: Combine multiple generated clips into sequences
- **Motion Synthesis**: Generate realistic or stylized motion

## Implementation

```ts
// Video generation request
interface VideoGenerationRequest {
  prompt: string
  duration: number // seconds
  fps: number
  resolution: { width: number; height: number }
  model: string
  style?: "realistic" | "animated" | "cinematic"
  seed?: number
}

// Generated video
interface GeneratedVideo {
  id: string
  url: string
  duration: number
  fps: number
  resolution: { width: number; height: number }
  format: "mp4" | "webm" | "mov"
  size: number
  thumbnailUrl: string
  generationTime: number
}

// Scene definition for script-to-video
interface Scene {
  id: string
  script: string
  visualDescription: string
  duration: number
  transition: "cut" | "fade" | "dissolve" | "wipe"
  audio?: {
    narration?: string
    music?: string
    sfx?: string[]
  }
}

// Script-to-video pipeline
interface ScriptVideoPipeline {
  scenes: Scene[]
  resolution: { width: number; height: number }
  fps: number
  outputFormat: "mp4" | "webm"
  musicTrack?: string
  voiceover?: { voice: string; speed: number }
}
```

```ts
// Generate video from script
async function generateFromScript(
  pipeline: ScriptVideoPipeline
): Promise<GeneratedVideo> {
  // 1. Generate individual scene clips
  const clips = await Promise.all(
    pipeline.scenes.map((scene) => generateSceneClip(scene, pipeline.resolution, pipeline.fps))
  )
  
  // 2. Generate or apply voiceover
  const audioTracks = await generateAudioTracks(pipeline.scenes, pipeline.voiceover)
  
  // 3. Compose scenes with transitions
  const composed = await composeVideo(clips, {
    transitions: pipeline.scenes.map((s) => s.transition),
    audioTracks,
    musicTrack: pipeline.musicTrack,
  })
  
  // 4. Render final output
  return await renderVideo(composed, {
    resolution: pipeline.resolution,
    fps: pipeline.fps,
    format: pipeline.outputFormat,
  })
}
```

## Best Practices

- Use consistent style/settings across scenes for coherence
- Pre-generate keyframes to maintain visual consistency
- Implement scene validation before full video rendering
- Support progress tracking for long generation tasks
- Provide preview renders at lower quality for quick review
- Cache generated assets to avoid regenerating unchanged scenes
- Support manual adjustment of AI-generated timing
- Optimize output encoding for web delivery (H.264/H.265)
