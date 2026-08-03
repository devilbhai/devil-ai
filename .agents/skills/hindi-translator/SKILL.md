---
name: hindi-translator
description: Hindi language translation. Covers English to Hindi, Hindi to English, formal/informal tone, technical terminology.
---

# Hindi Translator

## When to Apply
Use this skill when translating content between English and Hindi, or when creating Hindi-language content. Applies to product descriptions, marketing materials, customer support, and documentation.

## Core Concepts
- **Direction**: English → Hindi, Hindi → English
- **Script**: Devanagari script
- **Registers**: Shuddh Hindi (formal), Hindustani (colloquial), Hinglish (mixed)
- **Technical Terms**: Agricultural, scientific, legal terminology in Hindi
- **Cultural Context**: Honorifics, gender agreements, number agreements

## Implementation
```typescript
interface TranslationRequest {
  text: string
  sourceLang: "en" | "hi"
  targetLang: "en" | "hi"
  context?: "business" | "casual" | "agricultural" | "legal"
  tone?: "formal" | "informal" | "hinglish"
}

interface TranslationResult {
  original: string
  translated: string
  confidence: number
  alternatives?: string[]
  script?: "devanagari" | "romanized"
}

function translateToHindi(
  text: string,
  context: TranslationContext
): TranslationResult {
  // Handle Hindi grammar rules (postpositions, gender)
  // Preserve brand names and product names
  // Support Devanagari and Romanized output
  // Return translation with confidence score
}

// Common agricultural terms
const agriculturalTerms: Record<string, string> = {
  fertilizer: "खाद",
  pesticide: "कीटनाशक",
  seed: "बीज",
  harvest: "फसल कटाई",
  irrigation: "सिंचाई",
}
```

## Best Practices
- Use Shuddh Hindi for formal/regulatory content
- Use Hindustani for mass-market consumer content
- Preserve technical/brand terms in English when standard Hindi equivalents are unfamiliar
- Validate gender and number agreements in translated text
- Maintain glossary of consistent translations for recurring terms
