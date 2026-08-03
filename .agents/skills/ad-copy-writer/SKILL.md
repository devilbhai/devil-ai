---
name: ad-copy-writer
description: Ad copywriting. PPC ads, social ads, conversion-focused copy.
---

# Ad Copy Writer

## When to Apply
Use this skill when writing Google Ads, Facebook/Instagram ads, LinkedIn ads, or any paid advertising copy.

## Core Concepts
- Character limits: respect platform restrictions
- Benefit-driven: lead with what the user gains
- Urgency triggers: limited time, scarcity
- A/B testing mindset: always write multiple variants
- Quality Score: relevance between copy, keywords, and landing page

## Implementation

```typescript
interface AdCopy {
  platform: "google" | "facebook" | "instagram" | "linkedin" | "twitter"
  product: string
  audience: string
  goal: "clicks" | "leads" | "sales" | "awareness"
  budget: "low" | "medium" | "high"
}

function generateAdVariants(ad: AdCopy, count: number): AdVariant[] {
  const variants: AdVariant[] = []
  for (let i = 0; i < count; i++) {
    variants.push({
      headline: createHeadline(ad.product, ad.audience, i),
      description: createDescription(ad.product, ad.goal, i),
      cta: selectCTA(ad.goal),
    })
  }
  return variants
}

function optimizeForCTR(variants: AdVariant[]): AdVariant {
  return variants.reduce((best, current) =>
    predictCTR(current) > predictCTR(best) ? current : best
  )
}
```

## Best Practices
- Include numbers and specifics in headlines
- Match ad copy to landing page messaging
- Use emotional triggers ethically
- Test at least 3 variants per ad set
- Monitor and pause underperforming ads
- Use ad extensions for extra visibility
