---
name: root-cause-analyzer
description: Root cause analysis techniques, 5 Whys, fishbone diagrams, and causal chain analysis.
---

# Root Cause Analyzer

## When to Apply
Use this skill when investigating failures, analyzing defects, finding underlying causes, or preventing recurring issues.

## Core Concepts
- 5 Whys analysis
- Fishbone (Ishikawa) diagrams
- Fault tree analysis
- Causal chain mapping
- Pareto analysis

## Implementation

### 5 Whys Analysis
```typescript
interface FiveWhys {
  problem: string
  whys: { question: string; answer: string }[]
  rootCause: string
  countermeasure: string
}

function conduct5Whys(problem: string, answers: string[]): FiveWhys {
  const whys: { question: string; answer: string }[] = []
  
  for (let i = 0; i < answers.length; i++) {
    whys.push({
      question: `Why ${i === 0 ? "did this happen?" : "did " + (whys[i-1]?.answer || "").toLowerCase() + "?"}`,
      answer: answers[i]
    })
  }
  
  return {
    problem,
    whys,
    rootCause: answers[answers.length - 1],
    countermeasure: "Define countermeasure for: " + answers[answers.length - 1]
  }
}
```

### Fishbone Categories
- **People**: Skills, training, communication
- **Process**: Procedures, policies, workflows
- **Technology**: Tools, systems, infrastructure
- **Materials**: Data, inputs, resources
- **Environment**: Physical, organizational, market
- **Measurement**: Metrics, monitoring, thresholds

### Causal Chain
```typescript
interface CausalChain {
  trigger: string
  events: string[]
  failure: string
  impact: string
}
```

## Best Practices
- Focus on systems, not blame
- Look for multiple contributing causes
- Verify root cause with data
- Implement systemic countermeasures
- Document for future reference
