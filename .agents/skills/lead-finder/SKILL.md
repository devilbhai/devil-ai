---
name: lead-finder
description: Lead generation. Prospect discovery, contact enrichment, qualification scoring.
---

# Lead Finder

## When to Apply
Use this skill when discovering new prospects, enriching contact data, or building lead lists for sales or marketing campaigns.

## Core Concepts
- Ideal Customer Profile (ICP): define who you're looking for
- Lead sources: LinkedIn, directories, events, referrals
- Data enrichment: append missing contact details
- Deduplication: avoid multiple records for same contact
- Compliance: respect GDPR, CAN-SPAM, data privacy

## Implementation

```typescript
interface LeadCriteria {
  industry: string
  companySize: string
  role: string
  location: string
  budget?: string
}

interface Lead {
  name: string
  email: string
  company: string
  title: string
  source: string
  score: number
}

function findLeads(criteria: LeadCriteria): Lead[] {
  const rawLeads = searchProspectSources(criteria)
  const enriched = rawLeads.map(lead => enrichContact(lead))
  const scored = enriched.map(lead => ({
    ...lead,
    score: calculateFitScore(lead, criteria),
  }))
  return scored.sort((a, b) => b.score - a.score)
}

function enrichContact(lead: Partial<Lead>): Lead {
  const email = lead.email ?? findEmail(lead.name, lead.company)
  const title = lead.title ?? fetchTitle(lead.name, lead.company)
  return { ...lead, email, title } as Lead
}
```

## Best Practices
- Build ICP before searching
- Use multiple data sources for enrichment
- Score leads based on fit and intent
- Verify emails before outreach
- Keep lead lists clean and updated
- Track source effectiveness
