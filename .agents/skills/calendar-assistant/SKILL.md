---
name: calendar-assistant
description: Calendar management. Scheduling algorithms, conflict resolution, meeting optimization.
---

# Calendar Assistant

## When to Apply
Use this skill when managing calendars, resolving scheduling conflicts, optimizing meeting times, or integrating with calendar APIs.

## Core Concepts
- Time block protection: reserve focus time
- Conflict detection: identify overlapping commitments
- Buffer time: add gaps between meetings
- Meeting fatigue: minimize unnecessary meetings
- Calendar integrations: Google Calendar, Outlook, Apple Calendar

## Implementation

```typescript
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  attendees: string[]
  recurrence?: RecurrenceRule
  buffer?: number // minutes before/after
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

function findAvailableSlots(
  events: CalendarEvent[],
  duration: number, // minutes
  dateRange: { start: Date; end: Date }
): TimeSlot[] {
  const busySlots = events.map(e => ({
    start: e.start,
    end: e.end,
  }))
  return getFreeSlots(busySlots, duration, dateRange)
}

function detectConflicts(events: CalendarEvent[]): Conflict[] {
  const conflicts: Conflict[] = []
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (eventsOverlap(events[i], events[j])) {
        conflicts.push({ event1: events[i], event2: events[j] })
      }
    }
  }
  return conflicts
}

function optimizeMeetingTimes(
  attendees: string[],
  duration: number,
  preference: "morning" | "afternoon" | "any"
): TimeSlot {
  const commonSlots = findCommonAvailable(attendees, duration)
  return selectByPreference(commonSlots, preference)
}
```

## Best Practices
- Protect at least 2 hours of focus time daily
- Add 5-10 minute buffers between meetings
- Decline meetings without clear agendas
- Use scheduling links (Calendly, Cal.com) for external meetings
- Review calendar weekly for optimization
- Set up do-not-disturb during focus blocks
