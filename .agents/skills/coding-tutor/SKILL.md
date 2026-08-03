---
name: coding-tutor
description: Programming education. Code review, concept explanation, exercise generation.
---

# Coding Tutor

## When to Apply

- When building programming education features
- When implementing code review or feedback tools
- When creating coding exercises or challenges
- When working with multiple programming languages and concepts

## Core Concepts

- **Code Review**: Analyze student code for correctness, style, and efficiency
- **Concept Explanation**: Break down programming concepts with examples
- **Exercise Generation**: Create practice problems with test cases
- **Progression Tracking**: Monitor skill development across topics
- **Multi-Language Support**: Teach concepts across different languages

## Implementation

```ts
// Coding exercise
interface CodingExercise {
  id: string
  title: string
  difficulty: "beginner" | "intermediate" | "advanced"
  language: string
  topic: string
  description: string
  starterCode: string
  testCases: TestCase[]
  hints: string[]
  solutions: { approach: string; code: string }[]
}

interface TestCase {
  input: string
  expectedOutput: string
  description: string
}

// Code review result
interface CodeReview {
  exerciseId: string
  studentCode: string
  score: number // 0-100
  feedback: {
    category: "correctness" | "efficiency" | "style" | "readability"
    severity: "info" | "warning" | "error"
    line?: number
    message: string
    suggestion?: string
  }[]
  passedTests: number
  totalTests: number
}

// Programming concept
interface ProgrammingConcept {
  id: string
  name: string
  language?: string // language-specific or universal
  category: "fundamentals" | "data_structures" | "algorithms" | "patterns" | "best_practices"
  difficulty: number // 1-10
  description: string
  examples: CodeExample[]
  exercises: CodingExercise[]
  prerequisites: string[]
}

interface CodeExample {
  title: string
  code: string
  explanation: string
  output?: string
}
```

```ts
// Review student code
async function reviewCode(
  studentCode: string,
  exercise: CodingExercise
): Promise<CodeReview> {
  const testResults = await runTests(studentCode, exercise.testCases)
  const staticAnalysis = analyzeCode(studentCode, exercise.language)
  const styleIssues = checkStyle(studentCode, exercise.language)
  
  return {
    exerciseId: exercise.id,
    studentCode,
    score: calculateScore(testResults, staticAnalysis, styleIssues),
    feedback: [...testResults.feedback, ...staticAnalysis.feedback, ...styleIssues],
    passedTests: testResults.passed,
    totalTests: exercise.testCases.length,
  }
}

// Generate exercise for topic
function generateExercise(
  topic: string,
  language: string,
  difficulty: string
): CodingExercise {
  const template = getExerciseTemplate(topic, difficulty)
  const testCases = generateTestCases(template)
  const hints = generateHints(template)
  
  return {
    id: generateId(),
    title: template.title,
    difficulty: difficulty as CodingExercise["difficulty"],
    language,
    topic,
    description: template.description,
    starterCode: template.starterCode,
    testCases,
    hints,
    solutions: template.solutions,
  }
}
```

## Best Practices

- Provide immediate, specific feedback on code
- Show expected vs actual output for failed tests
- Offer hints progressively (not all at once)
- Support multiple valid solutions for each exercise
- Track student progress across topics and difficulty levels
- Include real-world project exercises alongside concept practice
- Support both guided and open-ended coding challenges
- Generate diverse test cases including edge cases
