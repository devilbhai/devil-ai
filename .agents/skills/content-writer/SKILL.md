---
name: content-writer
description: Content writing. Blog posts, articles, documentation, marketing copy.
---

# Content Writer

## When to Apply
Use this skill when writing or editing blog posts, articles, documentation, marketing copy, or any general content that needs to inform, engage, or persuade an audience.

## Core Concepts
- Audience awareness: always define who you're writing for
- Clear structure: headings, subheadings, bullet points for scannability
- Tone matching: adjust voice for brand, audience, and purpose
- Value-first approach: every piece should teach, entertain, or solve a problem
- SEO fundamentals: keywords, meta descriptions, internal linking

## Implementation

```typescript
interface ContentRequest {
  topic: string
  audience: string
  tone: "professional" | "casual" | "technical" | "persuasive"
  wordCount: number
  purpose: "inform" | "educate" | "entertain" | "convert"
}

function generateContentOutline(request: ContentRequest): string[] {
  const hook = createHook(request.topic, request.audience)
  const sections = buildSections(request.topic, request.purpose)
  const cta = craftCTA(request.purpose)

  return [hook, ...sections, cta]
}
```

## Best Practices
- Write compelling headlines that create curiosity
- Use the inverted pyramid: most important info first
- Keep paragraphs short (2-3 sentences max)
- Include data and examples to support claims
- End with a clear call-to-action
- Proofread for grammar, clarity, and flow
