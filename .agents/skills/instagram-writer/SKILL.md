---
name: instagram-writer
description: Instagram content. Captions, hashtag strategy, visual content planning.
---

# Instagram Writer

## When to Apply
Use this skill when writing Instagram captions, planning content themes, developing hashtag strategies, or creating carousel copy.

## Core Concepts
- Caption structure: hook, story, CTA
- Hashtag research: mix of popular, niche, and branded
- Visual storytelling: caption complements the image/video
- Reel scripts: short, punchy, trend-aware
- Story content: polls, questions, behind-the-scenes

## Implementation

```typescript
interface InstagramCaption {
  type: "post" | "reel" | "story" | "carousel"
  topic: string
  tone: "casual" | "inspirational" | "educational" | "humorous"
  maxLength?: number
}

function generateCaption(content: InstagramCaption): string {
  const hook = createScrollStopper(content.topic)
  const body = writeCaptionBody(content.topic, content.tone)
  const cta = createInstagramCTA(content.type)
  const hashtags = generateHashtagSet(content.topic)

  return `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`
}

function planCarouselSlides(mainTopic: string, slideCount: number): string[] {
  const slides: string[] = []
  for (let i = 0; i < slideCount; i++) {
    slides.push(createCarouselSlide(mainTopic, i, slideCount))
  }
  return slides
}
```

## Best Practices
- First line must hook attention
- Use line breaks for readability
- 5-15 relevant hashtags per post
- Mix hashtag sizes (small, medium, large)
- Include CTA in every caption
- Write captions in advance and batch schedule
