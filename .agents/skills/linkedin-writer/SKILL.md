---
name: linkedin-writer
description: LinkedIn content. Professional posts, article writing, networking messages.
---

# LinkedIn Writer

## When to Apply
Use this skill when writing LinkedIn posts, articles, connection messages, InMail, or professional networking content.

## Core Concepts
- Professional tone with personality
- Hook-driven openings that stop the scroll
- Storytelling with business lessons
- Thought leadership positioning
- Engagement-first design: questions, polls, carousels

## Implementation

```typescript
interface LinkedInContent {
  type: "post" | "article" | "message" | "comment"
  topic: string
  goal: "engagement" | "authority" | "networking" | "lead-gen"
  voice: "personal" | "corporate" | "thought-leader"
}

function generateLinkedInPost(content: LinkedInContent): string {
  const hook = createLinkedInHook(content.topic)
  const story = buildStory(content.topic, content.voice)
  const takeaway = extractTakeaway(story)
  const cta = createEngagementCTA(content.goal)

  return `${hook}\n\n${story}\n\n${takeaway}\n\n${cta}`
}

function writeConnectionMessage(profile: {
  name: string
  role: string
  company: string
  sharedInterest?: string
}): string {
  return `Hi ${profile.name}, I noticed you're working at ${profile.company} as ${profile.role}. ${profile.sharedInterest ? `I'm also interested in ${profile.sharedInterest}.` : ""} I'd love to connect and exchange insights.`
}
```

## Best Practices
- Start with a strong hook (first 2 lines visible before "see more")
- Use white space generously
- Share personal experiences and lessons
- End with a question to drive comments
- Avoid external links in posts (kills reach)
- Post 3-5 times per week consistently
