---
name: video-editor
description: Video editing automation. Cutting, transitions, effects, rendering.
---

# Video Editor

## When to Apply

- When building video editing or automation features
- When implementing cutting, splicing, or trimming tools
- When creating transition or effect systems
- When working with batch video processing or rendering

## Core Concepts

- **Timeline Editing**: Sequence clips, audio, and effects on a timeline
- **Cutting/Trimming**: Split, trim, and arrange video segments
- **Transitions**: Fade, dissolve, wipe, zoom between clips
- **Effects**: Filters, overlays, text, motion graphics
- **Rendering**: Export timeline to final video format

## Implementation

```ts
// Video project timeline
interface VideoProject {
  id: string
  name: string
  tracks: Track[]
  duration: number // total project duration in seconds
  fps: number
  resolution: { width: number; height: number }
}

interface Track {
  id: string
  type: "video" | "audio" | "text" | "overlay"
  clips: Clip[]
}

interface Clip {
  id: string
  source: string // source file URL
  startFrame: number // start in source
  endFrame: number // end in source
  position: number // position on timeline (seconds)
  duration: number
  effects: Effect[]
  transition?: Transition
}

interface Effect {
  type: string
  params: Record<string, number | string>
  startTime: number
  duration: number
}

interface Transition {
  type: "cut" | "fade" | "dissolve" | "wipe" | "zoom"
  duration: number
  params?: Record<string, unknown>
}

// Render configuration
interface RenderConfig {
  format: "mp4" | "webm" | "mov"
  codec: "h264" | "h265" | "vp9" | "av1"
  quality: "draft" | "standard" | "high"
  fps: number
  resolution: { width: number; height: number }
  audioCodec: "aac" | "opus" | "mp3"
  bitrate?: number
}
```

```ts
// Trim clip
function trimClip(clip: Clip, startTime: number, endTime: number): Clip {
  return {
    ...clip,
    startFrame: clip.startFrame + Math.floor(startTime * clip.fps),
    endFrame: clip.startFrame + Math.floor(endTime * clip.fps),
    duration: endTime - startTime,
  }
}

// Add transition between clips
function addTransition(clipA: Clip, clipB: Clip, transition: Transition): [Clip, Clip] {
  const overlap = transition.duration
  return [
    { ...clipA, duration: clipA.duration - overlap / 2 },
    { ...clipB, position: clipB.position - overlap / 2, transition },
  ]
}

// Render timeline to video
async function renderTimeline(
  project: VideoProject,
  config: RenderConfig
): Promise<string> {
  const ffmpeg = new FFmpeg()
  await buildFFmpegCommand(ffmpeg, project, config)
  const outputPath = getOutputPath(project.id, config.format)
  await ffmpeg.run()
  return outputPath
}
```

## Best Practices

- Use proxy files for smooth editing of high-resolution source material
- Implement non-destructive editing (store operations, not modified files)
- Support real-time preview at reduced quality during editing
- Use hardware acceleration for rendering when available
- Maintain undo/redo history for all editing operations
- Support common keyboard shortcuts for professional workflows
- Auto-save project state to prevent data loss
- Export metadata alongside rendered video for compatibility
