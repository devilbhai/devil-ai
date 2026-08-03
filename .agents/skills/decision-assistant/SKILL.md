---
name: decision-assistant
description: Structured decision-making frameworks, pros/cons analysis, and decision documentation.
---

# Decision Assistant

## When to Apply
Use this skill when making complex decisions, evaluating options, documenting rationale, or facilitating group decisions.

## Core Concepts
- Decision matrices
- Pros/cons analysis
- Weighted scoring
- Cost-benefit analysis
- Risk assessment

## Implementation

### Decision Matrix
```typescript
interface DecisionOption {
  name: string
  scores: Record<string, number> // criteria -> score (1-10)
  weights: Record<string, number> // criteria -> weight (0-1)
}

function calculateWeightedScore(option: DecisionOption): number {
  let totalScore = 0
  let totalWeight = 0
  
  for (const [criteria, score] of Object.entries(option.scores)) {
    const weight = option.weights[criteria] || 0
    totalScore += score * weight
    totalWeight += weight
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0
}

function rankOptions(options: DecisionOption[]): { option: string; score: number }[] {
  return options
    .map(o => ({ option: o.name, score: calculateWeightedScore(o) }))
    .sort((a, b) => b.score - a.score)
}
```

### Decision Document Template
```markdown
## Decision: {Title}
**Date**: {Date}
**Status**: Proposed | Accepted | Superseded
**Context**: {Why this decision needs to be made}
**Options**: {List of options considered}
**Decision**: {What was decided}
**Consequences**: {What follows from this decision}
```

### Eisenhower Matrix (Urgency vs Importance)
| | Urgent | Not Urgent |
|---|---|---|
| **Important** | DO | SCHEDULE |
| **Not Important** | DELEGATE | ELIMINATE |

## Best Practices
- Document decision criteria before evaluating
- Include both quantitative and qualitative factors
- Record assumptions and constraints
- Document rejected options and why
- Review decisions periodically
