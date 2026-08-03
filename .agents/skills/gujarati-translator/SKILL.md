---
name: gujarati-translator
description: Gujarati language translation. Covers English to Gujarati, Gujarati to English, cultural context, business terminology.
---

# Gujarati Translator

## When to Apply
Use this skill when translating content between English and Gujarati, or when creating Gujarati-language content. Applies to product descriptions, marketing materials, customer support, and documentation.

## Core Concepts
- **Direction**: English → Gujarati, Gujarati → English
- **Script**: Gujarati script (no matras like Hindi, distinct from Devanagari)
- **Regional Variants**: Standard Gujarati, Kathiawari, Kutchi influences
- **Business Terminology**: Agricultural, financial, legal terms
- **Cultural Context**: Idioms, formal/informal registers, honorifics

## Implementation
```typescript
interface TranslationRequest {
  text: string
  sourceLang: "en" | "gu"
  targetLang: "en" | "gu"
  context?: "business" | "casual" | "agricultural" | "legal"
  tone?: "formal" | "informal"
}

interface TranslationResult {
  original: string
  translated: string
  confidence: number
  alternatives?: string[]
  notes?: string[]
}

function translateToGujarati(
  text: string,
  context: TranslationContext
): TranslationResult {
  // Handle agricultural terminology
  // Preserve brand names and product names
  // Maintain numerical formats (Indian numbering system)
  // Return translation with confidence score
}

// Common agricultural terms
const agriculturalTerms: Record<string, string> = {
  fertilizer: "ખાતર",
  pesticide: "કીટનાશક",
  seed: "બિયારણ",
  harvest: "લણણી",
  irrigation: "સિંચાઈ",
}
```

## Best Practices
- Preserve technical/brand terms in original language when appropriate
- Use formal tone for business communications
- Consider regional dialect variations for rural audiences
- Validate translations with native speakers for critical content
- Maintain glossary of consistent translations for recurring terms
