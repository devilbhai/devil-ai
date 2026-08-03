---
name: math-solver
description: Mathematical problem solving. Equation solving, proof verification, step-by-step solutions.
---

# Math Solver

## When to Apply

- When building mathematical problem-solving features
- When implementing equation solving or proof verification
- When creating step-by-step solution generation
- When working with algebra, calculus, geometry, or statistics

## Core Concepts

- **Equation Solving**: Algebraic, differential, integral equations
- **Step-by-Step Solutions**: Break down complex problems into steps
- **Proof Verification**: Check logical validity of mathematical proofs
- **Graphing**: Visualize functions and data
- **Mathematical Notation**: Render and parse LaTeX/mathematical expressions

## Implementation

```ts
// Math problem
interface MathProblem {
  id: string
  type: "equation" | "inequality" | "calculus" | "geometry" | "statistics" | "linear_algebra"
  expression: string // LaTeX format
  variables?: string[]
  constraints?: string[]
  difficulty: "elementary" | "high_school" | "college" | "advanced"
}

// Solution step
interface SolutionStep {
  stepNumber: number
  description: string
  expression: string // LaTeX
  rule: string // e.g., "distributive property", "quadratic formula"
  explanation?: string
}

// Complete solution
interface MathSolution {
  problemId: string
  steps: SolutionStep[]
  finalAnswer: string
  isCorrect: boolean
  alternativeSolutions?: SolutionStep[][]
  graphUrl?: string
}

// Proof verification
interface ProofVerification {
  proofId: string
  isValid: boolean
  errors: {
    step: number
    issue: string
    suggestion: string
  }[]
  confidence: number
}
```

```ts
// Solve equation step by step
function solveEquation(equation: string, variable: string): MathSolution {
  const steps: SolutionStep[] = []
  let current = parseExpression(equation)
  
  // Apply solving strategy based on equation type
  if (isQuadratic(current)) {
    steps.push({ stepNumber: 1, description: "Identify coefficients", expression: extractCoefficients(current), rule: "standard form" })
    steps.push({ stepNumber: 2, description: "Apply quadratic formula", expression: "x = (-b ± √(b²-4ac)) / 2a", rule: "quadratic formula" })
    // ... continue steps
  } else if (isLinear(current)) {
    steps.push({ stepNumber: 1, description: "Isolate variable", expression: isolateVariable(current, variable), rule: "inverse operations" })
  }
  
  return {
    problemId: generateId(),
    steps,
    finalAnswer: steps[steps.length - 1]?.expression ?? "",
    isCorrect: true,
  }
}

// Verify a mathematical proof
function verifyProof(statements: ProofStatement[]): ProofVerification {
  const errors: ProofVerification["errors"] = []
  
  for (let i = 1; i < statements.length; i++) {
    const valid = checkLogicalStep(statements[i - 1], statements[i])
    if (!valid.isValid) {
      errors.push({ step: i, issue: valid.reason, suggestion: valid.suggestion })
    }
  }
  
  return {
    proofId: generateId(),
    isValid: errors.length === 0,
    errors,
    confidence: calculateConfidence(errors, statements.length),
  }
}
```

## Best Practices

- Parse LaTeX expressions robustly with error recovery
- Support multiple solving methods for the same problem
- Provide clear explanations for each step
- Use symbolic computation libraries (math.js, symbolic-math) for accuracy
- Render mathematical notation properly in the UI
- Support both exact and numerical solutions
- Validate intermediate steps to catch errors early
- Generate graphs for visual learners alongside algebraic solutions
