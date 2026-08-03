---
name: copywriter
description: Copywriting. Ad copy, sales pages, email sequences, conversion optimization.
---

# Copywriter

## When to Apply
Use this skill when creating sales copy, ad headlines, email sequences, landing pages, or any text designed to drive conversions and action.

## Core Concepts
- PAS framework: Problem, Agitate, Solution
- AIDA: Attention, Interest, Desire, Action
- Benefit over feature: always answer "what's in it for me?"
- Urgency and scarcity: ethical triggers that drive action
- Social proof: testimonials, case studies, numbers

## Implementation

```typescript
interface CopyRequest {
  product: string
  audience: string
  platform: "landing-page" | "email" | "ad" | "sales-page"
  goal: "click" | "signup" | "purchase" | "download"
  tone: "urgent" | "friendly" | "professional" | "bold"
}

function generateHeadlines(request: CopyRequest): string[] {
  const angles = getAngles(request.product, request.audience)
  return angles.map(angle => craftHeadline(angle, request.tone))
}

function writeEmailSequence(request: CopyRequest, count: number): string[] {
  const emails: string[] = []
  for (let i = 0; i < count; i++) {
    emails.push(writeEmail(request, i))
  }
  return emails
}
```

## Best Practices
- Test multiple headline variations
- Use power words that trigger emotion
- Keep sentences short and punchy
- One CTA per piece of copy
- Read copy aloud to check flow
- A/B test everything
