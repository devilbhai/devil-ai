---
name: youtube-script-writer
description: YouTube scriptwriting. Video scripts, thumbnail optimization, SEO.
---

# YouTube Script Writer

## When to Apply
Use this skill when writing video scripts, creating thumbnail concepts, optimizing video titles, or planning YouTube content strategy.

## Core Concepts
- Script structure: hook, intro, content, CTA, outro
- Retention optimization: pattern interrupts, cliffhangers
- Thumbnail + title pairing: curiosity + clarity
- SEO: keywords in title, description, tags
- Watch time: structure content to maximize engagement

## Implementation

```typescript
interface VideoScript {
  topic: string
  duration: number // minutes
  style: "educational" | "entertainment" | "vlog" | "tutorial"
  audience: string
}

function generateScript(video: VideoScript): ScriptSection[] {
  const hook = createVideoHook(video.topic, 15) // 15 second hook
  const intro = writeIntro(video.topic, video.audience)
  const sections = divideIntoSections(video.topic, video.duration - 2)
  const outro = writeOutro(video.style)

  return [hook, intro, ...sections, outro]
}

function generateThumbnailConcept(topic: string): ThumbnailConcept {
  return {
    text: createThumbnailText(topic),
    style: selectVisualStyle(topic),
    emotion: chooseEmotion(topic),
  }
}
```

## Best Practices
- Hook viewers in first 5-10 seconds
- Use pattern interrupts every 2-3 minutes
- Create open loops to maintain curiosity
- Script transitions between sections
- Include timestamps in description
- Optimize first 30 words of description for SEO
