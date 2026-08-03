---
name: flashcard-generator
description: Flashcard creation. Spaced repetition, memory techniques, deck management.
---

# Flashcard Generator

## When to Apply

- Creating study materials for learning
- Implementing spaced repetition systems
- Managing flashcard decks
- Applying memory techniques like mnemonics
- Building educational applications

## Core Concepts

- **Spaced Repetition**: Algorithm to schedule reviews at optimal intervals
- **Memory Techniques**: Mnemonics, chunking, visual associations
- **Deck Management**: Organizing cards into categories, tagging, filtering
- **Card Types**: Basic, cloze deletion, image occlusion, audio
- **Review Metrics**: Retention rate, difficulty rating, next review date

## Implementation

```typescript
interface Flashcard {
  id: string
  front: string
  back: string
  tags: string[]
  difficulty: number
  nextReview: Date
  interval: number
  easeFactor: number
}

function createFlashcard(front: string, back: string, tags: string[]): Flashcard {
  return {
    id: crypto.randomUUID(),
    front,
    back,
    tags,
    difficulty: 0,
    nextReview: new Date(),
    interval: 1,
    easeFactor: 2.5,
  }
}

function calculateNextReview(card: Flashcard, quality: number): Flashcard {
  // SM-2 algorithm implementation
  let newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor)
  
  let newInterval = card.interval
  if (quality >= 3) {
    if (card.interval === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(card.interval * newEaseFactor)
    }
  } else {
    newInterval = 1
  }
  
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  
  return {
    ...card,
    difficulty: quality,
    nextReview,
    interval: newInterval,
    easeFactor: newEaseFactor,
  }
}
```

## Best Practices

1. Keep cards simple and focused on one concept
2. Use images and visuals when possible
3. Tag cards for easy organization
4. Review regularly using spaced repetition
5. Track progress with metrics
6. Create decks for different subjects
7. Use mnemonics for complex information
8. Export/import decks for backup
9. Use cloze deletions for fill-in-the-blank learning
10. Adjust intervals based on performance