---
name: email-writer
description: Professional email writing. Covers business emails, follow-ups, cold outreach, templates, tone management, subject lines.
---

# Email Writer

## When to Apply
Use this skill when drafting professional emails, follow-ups, cold outreach, or email campaigns. Applies to business communication, sales outreach, and customer engagement.

## Core Concepts
- **Email Types**: Business inquiry, follow-up, cold outreach, newsletter, transactional
- **Tone**: Formal, semi-formal, casual based on context
- **Subject Lines**: Attention-grabbing, clear, action-oriented
- **Structure**: Subject, greeting, body, CTA, signature
- **Templates**: Reusable patterns for common scenarios

## Implementation
```typescript
interface EmailDraft {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  priority: "low" | "normal" | "high"
  followUp?: FollowUpConfig
}

interface FollowUpConfig {
  afterDays: number
  maxFollowUps: number
  template: string
}

function writeBusinessEmail(config: EmailConfig): EmailDraft {
  const tone = config.tone || "semi-formal"
  return {
    to: config.recipients,
    subject: generateSubject(config),
    body: buildBody(config, tone),
    priority: config.priority || "normal",
  }
}

function generateSubject(config: EmailConfig): string {
  // Action-oriented, concise (50 chars max), no spam triggers
  return `${config.action}: ${config.topic}`
}
```

## Best Practices
- Keep subject lines under 50 characters
- Use personalization tokens for bulk emails
- Include clear CTA (Call to Action)
- Follow up within 3-5 business days if no response
- A/B test subject lines for open rate optimization
