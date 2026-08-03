---
name: customer-support
description: Customer support systems. Ticket management, knowledge base, chatbot design.
---

# Customer Support

## When to Apply
Use this skill when designing support systems, creating knowledge bases, building chatbots, or optimizing ticket workflows.

## Core Concepts
- Ticket prioritization: urgency x impact matrix
- Knowledge base: self-service reduces ticket volume
- Chatbot design: handle common queries, escalate complex ones
- SLA management: response and resolution time targets
- Customer satisfaction: CSAT, NPS measurement

## Implementation

```typescript
interface Ticket {
  id: string
  subject: string
  body: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "waiting" | "resolved"
  assignee?: string
  sla: SLADeadline
}

interface SLADeadline {
  firstResponse: Date
  resolution: Date
}

function prioritizeTicket(ticket: Ticket): number {
  const urgency = calculateUrgency(ticket)
  const impact = calculateImpact(ticket)
  return urgency * impact
}

function routeTicket(ticket: Ticket, agents: Agent[]): Agent {
  return agents
    .filter(a => a.skills.includes(ticket.category))
    .sort((a, b) => a.load - b.load)[0]
}

function generateKnowledgeArticle(query: string): KnowledgeArticle {
  const existing = searchKnowledgeBase(query)
  if (existing) return existing
  return createArticle(query, findRelevantDocs(query))
}

function designChatbotFlows(intents: string[]): ChatbotFlow[] {
  return intents.map(intent => ({
    intent,
    trigger: identifyTrigger(intent),
    responses: generateResponses(intent),
    escalation: shouldEscalate(intent),
  }))
}
```

## Best Practices
- Respond to critical tickets within 1 hour
- Use templates for common issues but personalize
- Track resolution time per agent
- Update knowledge base weekly
- Survey customers after resolution
- Analyze ticket trends for product improvements
