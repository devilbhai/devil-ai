---
name: lead-qualification
description: Lead scoring and qualification. BANT framework, scoring models, pipeline management.
---

# Lead Qualification

## When to Apply
Use this skill when scoring leads, qualifying prospects against criteria, or managing lead-to-opportunity conversion.

## Core Concepts
- BANT: Budget, Authority, Need, Timeline
- Lead scoring: numerical ranking based on fit and behavior
- Qualification questions: discover readiness to buy
- Disqualification criteria: know when to walk away
- Handoff criteria: sales-ready thresholds

## Implementation

```typescript
interface QualifiedLead {
  id: string
  name: string
  email: string
  score: number
  bant: BANTScore
  behaviorScore: number
  fitScore: number
}

interface BANTScore {
  budget: number // 0-10
  authority: number
  need: number
  timeline: number
}

function scoreLead(lead: QualifiedLead): number {
  const bantTotal = Object.values(lead.bant).reduce((a, b) => a + b, 0)
  const bantScore = (bantTotal / 40) * 50 // 50% weight
  const behaviorWeight = (lead.behaviorScore / 100) * 30 // 30% weight
  const fitWeight = (lead.fitScore / 100) * 20 // 20% weight

  return Math.round(bantScore + behaviorWeight + fitWeight)
}

function qualifiesForSales(lead: QualifiedLead): boolean {
  return lead.score >= 70 && lead.bant.budget >= 7 && lead.bant.authority >= 7
}

function generateQualificationQuestions(lead: QualifiedLead): string[] {
  const questions: string[] = []
  if (lead.bant.budget < 7) questions.push("What budget have you allocated for this?")
  if (lead.bant.authority < 7) questions.push("Who else is involved in the decision?")
  if (lead.bant.need < 7) questions.push("What specific challenge are you trying to solve?")
  if (lead.bant.timeline < 7) questions.push("What's your ideal timeline for implementation?")
  return questions
}
```

## Best Practices
- Define clear scoring thresholds
- Update scoring model based on conversion data
- Automate scoring where possible
- Review disqualified leads monthly for patterns
- Align sales and marketing on qualification criteria
- Document reasoning for each qualification decision
