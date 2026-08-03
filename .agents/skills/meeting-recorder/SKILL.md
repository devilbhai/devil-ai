---
name: meeting-recorder
description: Capture meeting notes, extract action items, generate minutes, and track follow-ups.
---

# Meeting Recorder

## When to Apply
Use this skill when recording meetings, taking notes, extracting decisions, or generating meeting minutes.

## Core Concepts
- Real-time note capture
- Action item extraction
- Decision logging
- Attendee tracking
- Follow-up generation

## Implementation

### Meeting Note Structure
```typescript
interface MeetingNotes {
  title: string
  date: Date
  attendees: string[]
  agenda: string[]
  discussions: Discussion[]
  decisions: Decision[]
  actionItems: ActionItem[]
  parkingLot: string[] // topics for later
}

interface Discussion {
  topic: string
  summary: string
  keyPoints: string[]
  unresolved: string[]
}

interface Decision {
  id: string
  description: string
  madeBy: string
  alternatives: string[]
  rationale: string
}

interface ActionItem {
  id: string
  task: string
  assignee: string
  dueDate?: Date
  priority: "high" | "medium" | "low"
  status: "pending" | "in-progress" | "completed"
}
```

### Auto-Extract Actions
```typescript
function extractActionItems(text: string): ActionItem[] {
  const patterns = [
    /(\w+)\s+(?:will|should|needs to|is going to)\s+(.+)/i,
    /(?:action|todo|task)[:\s]+(.+)/i,
    /(?:assign|responsible)[:\s]+(\w+)\s+(?:for|to)\s+(.+)/i,
  ]
  
  // Match patterns and extract action items
  // Return structured action items
}
```

### Meeting Minutes Template
```markdown
# Meeting Minutes

**Date**: {date}
**Attendees**: {names}
**Duration**: {time}

## Agenda
1. {topic}

## Discussions
### {Topic}
{summary}

## Decisions
- **{Decision}**: {rationale}

## Action Items
| Task | Assignee | Due | Priority |
|------|----------|-----|----------|
| {task} | {name} | {date} | {priority} |

## Parking Lot
- {topic for next time}
```

## Best Practices
- Capture decisions immediately
- Assign clear ownership for actions
- Include deadlines when mentioned
- Share notes within 24 hours
- Review action items at next meeting
