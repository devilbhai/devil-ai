---
name: interview-assistant
description: Interview management. Question generation, evaluation scoring, feedback collection.
---

# Interview Assistant

## When to Apply

- When building interview management features
- When generating interview questions or evaluation rubrics
- When implementing feedback collection or scoring systems
- When working with structured or technical interview formats

## Core Concepts

- **Question Generation**: Role-specific, skill-based, behavioral, and technical questions
- **Evaluation Rubrics**: Standardized scoring criteria for consistent assessment
- **Feedback Collection**: Structured forms, rating scales, comments
- **Interview Types**: Phone screen, technical, behavioral, panel, culture fit
- **Score Aggregation**: Combine interviewer scores into hiring recommendations

## Implementation

```ts
// Interview question
interface InterviewQuestion {
  id: string
  category: "technical" | "behavioral" | "situational" | "culture_fit"
  difficulty: "easy" | "medium" | "hard"
  question: string
  expectedAnswer?: string
  evaluationCriteria: string[]
  timeLimit?: number // minutes
}

// Evaluation rubric
interface EvaluationRubric {
  criteria: {
    name: string
    weight: number // 0-1
    levels: {
      score: number // 1-5
      description: string
    }[]
  }[]
}

// Interview feedback
interface InterviewFeedback {
  interviewId: string
  interviewerId: string
  scores: {
    criteria: string
    score: number
    notes: string
  }[]
  overallScore: number
  recommendation: "strong_hire" | "hire" | "neutral" | "no_hire" | "strong_no_hire"
  notes: string
  submittedAt: Date
}
```

```ts
// Generate role-specific questions
function generateQuestions(
  role: string,
  skills: string[],
  difficulty: "easy" | "medium" | "hard",
  count: number
): InterviewQuestion[] {
  const pool = questionBank.filter(
    (q) => q.category === "technical" && skills.some((s) => q.tags.includes(s))
  )
  return selectRandom(pool, count).map((q) => ({ ...q, difficulty }))
}

// Aggregate scores from multiple interviewers
function aggregateScores(feedbacks: InterviewFeedback[]): HiringRecommendation {
  const weightedScores = feedbacks.map((f) => ({
    score: f.overallScore,
    weight: getInterviewerWeight(f.interviewerId),
  }))
  const totalWeight = weightedScores.reduce((sum, w) => sum + w.weight, 0)
  const aggregateScore = weightedScores.reduce((s, w) => s + w.score * w.weight, 0) / totalWeight
  return { aggregateScore, recommendation: mapToRecommendation(aggregateScore) }
}
```

## Best Practices

- Use structured interviews with consistent questions for all candidates
- Weight technical and behavioral assessments appropriately for the role
- Allow adequate time between interview rounds for feedback submission
- Store historical interview data for process improvement analysis
- Ensure questions are legally compliant and non-discriminatory
- Provide training materials for interviewers on evaluation criteria
- Maintain question banks and rotate questions to prevent leakage
- Support anonymous feedback submission to reduce groupthink
