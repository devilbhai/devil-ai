---
name: agribee-farmer-support
description: Farmer support system. Covers crop advice, pest control, irrigation guidance, weather-based recommendations, support ticket management.
---

# AgriBee Farmer Support

## When to Apply
Use this skill when providing agricultural support to farmers, diagnosing crop issues, recommending treatments, or managing support tickets. Applies to chatbots, helplines, and advisory systems.

## Core Concepts
- **Crop Diagnosis**: Symptom identification, disease/pest identification, deficiency analysis
- **Pest Control**: IPM (Integrated Pest Management), organic solutions, chemical recommendations
- **Irrigation**: Water scheduling, drip/sprinkler guidance, moisture monitoring
- **Weather Integration**: Forecast-based advice, frost alerts, rain warnings
- **Ticket Management**: Issue tracking, escalation, follow-up scheduling

## Implementation
```typescript
interface SupportTicket {
  id: string
  farmerId: string
  crop: string
  issue: string
  symptoms: string[]
  images?: string[]
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "escalated"
  recommendations: Recommendation[]
  createdAt: Date
}

interface Recommendation {
  type: "pesticide" | "fertilizer" | "irrigation" | "cultural"
  description: string
  products?: ProductRef[]
  dosage?: string
  timing: string
  priority: number
}
```

## Best Practices
- Always ask for crop stage and local weather conditions before diagnosing
- Provide multiple treatment options (organic, chemical, cultural)
- Include application timing and safety precautions
- Follow up within 48 hours for high-severity issues
- Build knowledge base from resolved tickets
