---
name: quiz-generator
description: Quiz creation. Question generation, difficulty scaling, topic coverage.
---

# Quiz Generator

## When to Apply

- When building quiz or assessment creation features
- When implementing question generation or difficulty scaling
- When creating topic coverage or knowledge testing tools
- When working with timed quizzes, competitions, or certifications

## Core Concepts

- **Question Types**: Multiple choice, true/false, fill-in-the-blank, short answer, matching
- **Difficulty Scaling**: Adaptive difficulty based on performance
- **Topic Coverage**: Ensure balanced coverage across subtopics
- **Quiz Composition**: Balance question types, difficulty, and time limits
- **Scoring**: Point allocation, partial credit, penalty for wrong answers

## Implementation

```ts
// Quiz question
interface QuizQuestion {
  id: string
  type: "multiple_choice" | "true_false" | "fill_blank" | "short_answer" | "matching"
  difficulty: "easy" | "medium" | "hard"
  topic: string
  subtopic?: string
  question: string
  options?: string[] // for multiple choice
  correctAnswer: string | string[]
  points: number
  timeLimit?: number // seconds
  explanation?: string
  hint?: string
}

// Quiz
interface Quiz {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit: number // total minutes
  passingScore: number // percentage
  shuffleQuestions: boolean
  showResults: "immediately" | "after_submission" | "after_all"
}

// Quiz result
interface QuizResult {
  quizId: string
  studentId: string
  answers: {
    questionId: string
    answer: string | string[]
    isCorrect: boolean
    pointsEarned: number
    timeSpent: number
  }[]
  totalScore: number
  maxScore: number
  percentage: number
  passed: boolean
  completedAt: Date
}

// Quiz generation config
interface QuizConfig {
  topic: string
  questionCount: number
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
  timeLimit: number
  questionTypes: QuizQuestion["type"][]
  excludeQuestionIds?: string[]
  coverage?: { subtopic: string; minQuestions: number }[]
}
```

```ts
// Generate quiz with balanced coverage
function generateQuiz(config: QuizConfig): Quiz {
  const questionPool = getQuestionPool(config.topic)
  const filtered = questionPool.filter((q) => !config.excludeQuestionIds?.includes(q.id))
  
  const selected: QuizQuestion[] = []
  
  // Select by difficulty
  for (const [difficulty, count] of Object.entries(config.difficulty)) {
    const candidates = filtered.filter((q) => q.difficulty === difficulty && !selected.includes(q))
    selected.push(...selectRandom(candidates, count))
  }
  
  // Ensure topic coverage
  for (const coverage of config.coverage ?? []) {
    const inTopic = selected.filter((q) => q.subtopic === coverage.subtopic)
    if (inTopic.length < coverage.minQuestions) {
      const additional = filtered.filter((q) => q.subtopic === coverage.subtopic && !selected.includes(q))
      selected.push(...selectRandom(additional, coverage.minQuestions - inTopic.length))
    }
  }
  
  return {
    id: generateId(),
    title: `Quiz: ${config.topic}`,
    description: `${config.questionCount} questions on ${config.topic}`,
    questions: selected,
    timeLimit: config.timeLimit,
    passingScore: 70,
    shuffleQuestions: true,
    showResults: "after_submission",
  }
}

// Score quiz with partial credit
function scoreQuiz(quiz: Quiz, answers: Map<string, string | string[]>): QuizResult {
  const results = quiz.questions.map((q) => {
    const studentAnswer = answers.get(q.id)
    const isCorrect = checkAnswer(q, studentAnswer)
    const points = isCorrect ? q.points : q.type === "multiple_choice" ? 0 : q.points * 0.5 // partial credit
    return { questionId: q.id, answer: studentAnswer ?? "", isCorrect, pointsEarned: points, timeSpent: 0 }
  })
  
  const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0)
  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
  const percentage = (totalScore / maxScore) * 100
  
  return { quizId: quiz.id, studentId: "", answers: results, totalScore, maxScore, percentage, passed: percentage >= quiz.passingScore, completedAt: new Date() }
}
```

## Best Practices

- Shuffle question order and answer options to prevent cheating
- Include clear explanations for all answers
- Balance question types for diverse assessment
- Implement time limits appropriate to question complexity
- Support question pools for exam variants
- Track question statistics (correct rate, discrimination index)
- Avoid ambiguous wording in questions and options
- Generate results with detailed feedback for learning
