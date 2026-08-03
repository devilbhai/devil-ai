---
name: smart-suggestions
description: Intelligent suggestion systems. Context-aware recommendations, predictive input.
---

# Smart Suggestions

## When to Apply
Use this skill when building autocomplete systems, context-aware recommendations, or predictive input features.

## Core Concepts
- **Context analysis**: Parse current state to understand user intent
- **Ranking algorithms**: Score suggestions by relevance, recency, frequency
- **Fuzzy matching**: Tolerate typos and partial input
- **Caching**: Precompute suggestions for common patterns
- **Progressive disclosure**: Show top suggestions, expand on request

## Implementation
```typescript
interface Suggestion<T> {
  id: string
  label: string
  score: number
  data: T
}

function suggest<T>(
  input: string,
  candidates: Suggestion<T>[],
  maxResults = 10
): Suggestion<T>[] {
  const lower = input.toLowerCase()
  return candidates
    .map((s) => ({
      ...s,
      score: s.score * fuzzyMatch(lower, s.label.toLowerCase()),
    }))
    .filter((s) => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

function fuzzyMatch(query: string, target: string): number {
  let qi = 0
  let score = 0
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      score += 1
      qi++
    }
  }
  return qi === query.length ? score / target.length : 0
}
```

## Best Practices
- Debounce input before computing suggestions (150-300ms)
- Show loading state for async suggestion sources
- Cache frequently accessed suggestion data
- Support keyboard navigation (up/down arrows, enter to select)
- Learn from user selections to improve ranking over time
- Provide visual distinction between suggestion categories
