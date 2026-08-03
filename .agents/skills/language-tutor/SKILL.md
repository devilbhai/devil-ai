---
name: language-tutor
description: Language learning. Grammar explanation, vocabulary building, conversation practice.
---

# Language Tutor

## When to Apply

- When building language learning features
- When implementing grammar explanation or correction tools
- When creating vocabulary building or flashcard systems
- When working with conversation practice or translation

## Core Concepts

- **Grammar Explanation**: Break down sentence structures and rules
- **Vocabulary Building**: Spaced repetition, contextual learning, word families
- **Conversation Practice**: Role-play scenarios, dialogue generation
- **Pronunciation**: Audio-based feedback and phonetic guidance
- **Cultural Context**: Language use in cultural settings

## Implementation

```ts
// Language lesson
interface LanguageLesson {
  id: string
  language: string
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" // CEFR
  topic: string
  objectives: string[]
  content: LessonContent
  exercises: Exercise[]
  vocabulary: VocabularyItem[]
}

interface LessonContent {
  grammar?: GrammarSection
  dialogue?: DialogueLine[]
  reading?: { text: string; comprehension: { question: string; answer: string }[] }
}

interface GrammarSection {
  rule: string
  explanation: string
  examples: { sentence: string; translation?: string; analysis: string }[]
  exercises: GrammarExercise[]
}

interface GrammarExercise {
  type: "fill_blank" | "correct_error" | "translate" | "reorder"
  prompt: string
  correctAnswer: string
  hint?: string
}

// Vocabulary item with spaced repetition
interface VocabularyItem {
  id: string
  word: string
  translation: string
  language: string
  partOfSpeech: string
  exampleSentence: string
  pronunciation?: string
  audioUrl?: string
  srs: {
    interval: number // days until next review
    easeFactor: number
    repetitions: number
    nextReview: Date
  }
}

// Conversation practice
interface ConversationPractice {
  scenario: string
  context: string
  lines: DialogueLine[]
  vocabulary: string[]
  grammarPoints: string[]
}

interface DialogueLine {
  speaker: "student" | "partner" | "narrator"
  text: string
  translation?: string
  notes?: string
}
```

```ts
// Review vocabulary with SRS
function reviewVocabulary(items: VocabularyItem[], quality: number): VocabularyItem[] {
  return items.map((item) => {
    if (quality < 3) {
      // Reset on failure
      return { ...item, srs: { interval: 1, easeFactor: Math.max(1.3, item.srs.easeFactor - 0.2), repetitions: 0, nextReview: addDays(new Date(), 1) } }
    }
    // Advance on success
    const newInterval = item.srs.repetitions === 0 ? 1
      : item.srs.repetitions === 1 ? 6
      : Math.round(item.srs.interval * item.srs.easeFactor)
    return { ...item, srs: { interval: newInterval, easeFactor: item.srs.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)), repetitions: item.srs.repetitions + 1, nextReview: addDays(new Date(), newInterval) } }
  })
}

// Generate practice conversation
function generateConversation(
  scenario: string,
  level: string,
  language: string
): ConversationPractice {
  const vocab = selectVocabularyForLevel(level, language)
  const grammar = selectGrammarForLevel(level, language)
  const lines = generateDialogue(scenario, level, language)
  return { scenario, context: generateContext(scenario), lines, vocabulary: vocab.map((v) => v.word), grammarPoints: grammar.map((g) => g.rule) }
}
```

## Best Practices

- Use CEFR levels for consistent difficulty grading
- Implement spaced repetition for vocabulary retention
- Provide audio for pronunciation guidance
- Include cultural context in lessons
- Support both formal and informal language registers
- Offer bilingual and immersion modes
- Track learning streaks for motivation
- Generate personalized lessons based on student weaknesses
