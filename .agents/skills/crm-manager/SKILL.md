---
name: crm-manager
description: CRM management. Contact management, pipeline tracking, automation workflows.
---

# CRM Manager

## When to Apply
Use this skill when setting up CRM systems, managing contacts, tracking sales pipelines, or creating automation workflows.

## Core Concepts
- Contact enrichment: complete profiles with interaction history
- Pipeline stages: clear, measurable progression
- Automation triggers: event-based workflow activation
- Segmentation: group contacts by behavior, demographics, value
- Activity logging: track all touchpoints automatically

## Implementation

```typescript
interface Contact {
  id: string
  name: string
  email: string
  company: string
  stage: PipelineStage
  score: number
  lastActivity: Date
  tags: string[]
}

type PipelineStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed-won"
  | "closed-lost"

interface AutomationTrigger {
  event: "email-open" | "form-submit" | "page-visit" | "no-activity"
  condition: (contact: Contact) => boolean
  action: (contact: Contact) => void
}

function managePipeline(contacts: Contact[]): Map<PipelineStage, Contact[]> {
  const pipeline = new Map<PipelineStage, Contact[]>()
  for (const stage of Object.values(PipelineStage)) {
    pipeline.set(stage, contacts.filter(c => c.stage === stage))
  }
  return pipeline
}

function runAutomation(contacts: Contact[], triggers: AutomationTrigger[]): void {
  for (const trigger of triggers) {
    contacts
      .filter(c => trigger.condition(c))
      .forEach(c => trigger.action(c))
  }
}
```

## Best Practices
- Keep contact records up to date
- Define clear pipeline stages
- Set up automated follow-up reminders
- Segment contacts for targeted messaging
- Review pipeline health weekly
- Integrate with email and calendar tools
