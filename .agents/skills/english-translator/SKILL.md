---
name: english-translator
description: English language refinement. Covers grammar correction, style improvement, academic writing, business writing.
---

# English Translator

## When to Apply
Use this skill when refining English text, correcting grammar, improving style, or adapting content for specific audiences. Applies to documentation, marketing copy, business communication, and academic writing.

## Core Concepts
- **Grammar**: Syntax, punctuation, subject-verb agreement, tense consistency
- **Style**: Active voice, concise phrasing, parallel structure, word choice
- **Registers**: Academic, business, casual, technical
- **Audience**: Expert, general, beginner-level adaptation
- **Formats**: Email, report, article, product description

## Implementation
```typescript
interface RefinementRequest {
  text: string
  targetAudience: "expert" | "general" | "beginner"
  register: "academic" | "business" | "casual" | "technical"
  goals: ("grammar" | "style" | "clarity" | "tone" | "conciseness")[]
}

interface RefinementResult {
  original: string
  refined: string
  changes: Change[]
  score: number // readability score
}

interface Change {
  type: "grammar" | "style" | "clarity" | "tone"
  original: string
  replacement: string
  reason: string
}

function refineText(request: RefinementRequest): RefinementResult {
  // Apply grammar corrections
  // Improve style based on register
  // Adapt vocabulary for target audience
  // Calculate readability score (Flesch-Kincaid)
  // Return refined text with change log
}
```

## Best Practices
- Preserve original meaning and intent during refinement
- Use active voice unless passive is more appropriate
- Prefer common words over jargon for general audiences
- Maintain consistent tense throughout documents
- For agricultural content, balance technical accuracy with accessibility
