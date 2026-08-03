---
name: ai-tutor
description: AI tutoring systems. Personalized learning, adaptive difficulty, progress tracking.
---

# AI Tutor

## When to Apply

- When building AI tutoring or educational features
- When implementing personalized learning paths
- When creating adaptive difficulty or assessment systems
- When working with student progress tracking or analytics

## Core Concepts

- **Personalized Learning**: Adapt content to individual student needs
- **Adaptive Difficulty**: Adjust question complexity based on performance
- **Knowledge Tracking**: Map student mastery across topics
- **Learning Paths**: Sequential content with prerequisites and branches
- **Progress Analytics**: Visualize learning progress and identify gaps

## Implementation

```ts
// Student profile
interface StudentProfile {
  id: string
  name: string
  level: "beginner" | "intermediate" | "advanced"
  topics: TopicMastery[]
  learningStyle: "visual" | "auditory" | "reading" | "kinesthetic"
  pace: "slow" | "normal" | "fast"
  history: LearningEvent[]
}

// Topic mastery
interface TopicMastery {
  topicId: string
  mastery: number // 0-1
  attempts: number
  lastPracticed: Date
  struggles: string[] // specific sub-topics with low mastery
}

// Learning event
interface LearningEvent {
  type: "lesson" | "quiz" | "exercise" | "review"
  topicId: string
  score: number
  timeSpent: number // seconds
  timestamp: Date
}

// Adaptive question selection
interface QuestionSelector {
  getQuestion(profile: StudentProfile, topic: string): Question
  getReviewTopics(profile: StudentProfile): string[]
}

// Learning path
interface LearningPath {
  id: string
  name: string
  steps: {
    topicId: string
    type: "lesson" | "practice" | "assessment"
    prerequisite?: string
    estimatedTime: number
  }[]
}
```

```ts
// Select next question based on mastery
function selectQuestion(profile: StudentProfile, topic: string): Question {
  const mastery = profile.topics.find((t) => t.topicId === topic)
  const level = mastery?.mastery ?? 0
  
  if (level < 0.3) return getBeginnerQuestion(topic)
  if (level < 0.7) return getIntermediateQuestion(topic)
  return getAdvancedQuestion(topic)
}

// Update mastery after practice
function updateMastery(profile: StudentProfile, topic: string, score: number): StudentProfile {
  const existing = profile.topics.find((t) => t.topicId === topic)
  const newMastery = calculateMasteryUpdate(existing?.mastery ?? 0, score)
  
  return {
    ...profile,
    topics: [
      ...profile.topics.filter((t) => t.topicId !== topic),
      { topicId: topic, mastery: newMastery, attempts: (existing?.attempts ?? 0) + 1, lastPracticed: new Date(), struggles: identifyStruggles(topic, score) },
    ],
  }
}
```

## Best Practices

- Use spaced repetition for long-term retention
- Provide immediate feedback on answers
- Track both correct answers and time-to-answer
- Offer hints before revealing solutions
- Celebrate progress and maintain motivation
- Support multiple learning modalities (text, video, interactive)
- Allow manual difficulty override for student control
- Generate detailed progress reports for parents/teachers
