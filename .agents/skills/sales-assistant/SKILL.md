---
name: sales-assistant
description: Sales support. Proposal generation, follow-up sequences, objection handling.
---

# Sales Assistant

## When to Apply
Use this skill when generating sales proposals, creating follow-up sequences, handling objections, or supporting the sales process end-to-end.

## Core Concepts
- Proposal structure: problem, solution, value, pricing, next steps
- Follow-up cadence: timing that persists without annoying
- Objection handling: acknowledge, reframe, provide evidence
- Value selling: focus on outcomes, not features
- Closing techniques: assumptive, urgency, summary

## Implementation

```typescript
interface Proposal {
  prospect: string
  problem: string
  solution: string
  value: string[]
  pricing: PricingTier
  timeline: string
}

function generateProposal(prospect: ProspectData): Proposal {
  const problem = identifyPainPoints(prospect)
  const solution = tailorSolution(prospect.needs)
  const value = quantifyValue(prospect, solution)

  return {
    prospect: prospect.name,
    problem,
    solution,
    value,
    pricing: createPricingTier(prospect.budget),
    timeline: estimateTimeline(solution),
  }
}

function createFollowUpSequence(stage: SalesStage): FollowUp[] {
  const cadence = getOptimalCadence(stage)
  return cadence.map((day, i) => ({
    delay: day,
    template: selectTemplate(stage, i),
    channel: selectChannel(stage),
  }))
}

function handleObjection(objection: string): ObjectionResponse {
  const category = categorizeObjection(objection)
  return {
    acknowledge: generateAcknowledgment(category),
    reframe: generateReframe(category),
    evidence: gatherEvidence(category),
  }
}
```

## Best Practices
- Personalize every proposal
- Lead with the prospect's problem, not your product
- Include social proof relevant to their industry
- Follow up within 24 hours of meetings
- Track all interactions in CRM
- Prepare objection responses in advance
