---
name: agribee-marketing
description: Marketing content generation. Covers product descriptions, social media content, promotional material, campaign management.
---

# AgriBee Marketing Content

## When to Apply
Use this skill when creating marketing content, product descriptions, social media posts, or promotional materials for AgriBee products. Applies to content marketing, campaign management, and brand communication.

## Core Concepts
- **Product Copy**: Feature-benefit descriptions, USPs, comparison content
- **Social Media**: Platform-specific content (WhatsApp, Facebook, Instagram)
- **Campaigns**: Seasonal campaigns, product launches, festival promotions
- **Regional**: Gujarati, Hindi, English content variants
- **Visual**: Banner designs, infographic content, video scripts

## Implementation
```typescript
interface MarketingContent {
  id: string
  type: "product-description" | "social-post" | "banner" | "email" | "sms"
  platform?: "whatsapp" | "facebook" | "instagram" | "all"
  language: "en" | "gu" | "hi"
  content: ContentBlock[]
  targetAudience: "farmers" | "dealers" | "all"
  campaign?: CampaignRef
}

interface ContentBlock {
  type: "text" | "image" | "video" | "cta" | "list"
  value: string
  metadata?: Record<string, unknown>
}

function generateProductDescription(product: Product): MarketingContent {
  return {
    id: generateId(),
    type: "product-description",
    language: "en",
    content: [
      { type: "text", value: buildHeadline(product) },
      { type: "list", value: product.benefits.join("\n") },
      { type: "cta", value: "Contact your nearest dealer" },
    ],
    targetAudience: "farmers",
  }
}
```

## Best Practices
- Use simple, farmer-friendly language (avoid technical jargon)
- Include visual elements (images, icons) for better engagement
- Localize content for regional markets (Gujarati, Hindi)
- A/B test different messaging approaches
- Track content performance metrics (views, clicks, conversions)
