---
name: social-media-writer
description: Social media content. Platform-specific writing, engagement optimization, scheduling.
---

# Social Media Writer

## When to Apply
Use this skill when creating posts, threads, stories, or campaigns for social media platforms including LinkedIn, Twitter, Instagram, TikTok, and Facebook.

## Core Concepts
- Platform-native content: each platform has unique norms and formats
- Engagement hooks: first line must stop the scroll
- Hashtag strategy: relevant, not spammy
- Visual-text alignment: copy should complement imagery
- Timing: post when audience is most active

## Implementation

```typescript
interface SocialPost {
  platform: "linkedin" | "twitter" | "instagram" | "tiktok" | "facebook"
  topic: string
  format: "text" | "image" | "video" | "carousel" | "story"
  cta?: string
  hashtags?: string[]
}

function generatePost(post: SocialPost): string {
  const hook = createHook(post.topic, post.platform)
  const body = writeBody(post.topic, post.format)
  const hashtags = selectHashtags(post.topic, post.platform)
  return `${hook}\n\n${body}\n\n${hashtags}`
}

function scheduleContent(posts: SocialPost[], timezone: string): Date[] {
  return getOptimalTimes(posts, timezone)
}
```

## Best Practices
- Keep posts concise: 280 chars for Twitter, 1300 for LinkedIn
- Use line breaks for readability
- Include emojis where appropriate for the platform
- Engage with comments promptly
- Repurpose content across platforms with format adjustments
- Track performance and iterate
