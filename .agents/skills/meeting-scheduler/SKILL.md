---
name: meeting-scheduler
description: Meeting scheduling. Time zone handling, availability matching, agenda management.
---

# Meeting Scheduler

## When to Apply
Use this skill when scheduling meetings across time zones, matching availability, creating agendas, or coordinating group meetings.

## Core Concepts
- Time zone conversion: always normalize to UTC for comparison
- Availability windows: define when participants can meet
- Round-robin scheduling: distribute meetings evenly
- Agenda templates: ensure productive meetings
- No-show handling: reminders and rescheduling flows

## Implementation

```typescript
interface MeetingRequest {
  organizer: string
  participants: string[]
  duration: number
  preferredTime?: TimeRange
  timeZone: string
  agenda?: string
}

interface AvailabilityWindow {
  userId: string
  slots: TimeSlot[]
  timeZone: string
}

function findMeetingTime(
  request: MeetingRequest,
  availability: AvailabilityWindow[]
): TimeSlot | null {
  const normalized = availability.map(a => normalizeToUTC(a))
  const common = findIntersection(normalized)

  const suitable = common.filter(slot => {
    const localTime = toLocal(slot.start, request.timeZone)
    return isWithinPreference(localTime, request.preferredTime)
  })

  return suitable[0] ?? null
}

function createAgenda(topics: string[], duration: number): AgendaItem[] {
  const timePerTopic = Math.floor(duration / topics.length)
  return topics.map((topic, i) => ({
    topic,
    duration: i === topics.length - 1 ? duration - timePerTopic * (topics.length - 1) : timePerTopic,
    owner: "",
  }))
}

function formatTimeForAll(timezones: string[], date: Date): Map<string, string> {
  const result = new Map<string, string>()
  for (const tz of timezones) {
    result.set(tz, date.toLocaleString("en-US", { timeZone: tz }))
  }
  return result
}
```

## Best Practices
- Always confirm time zones before scheduling
- Send calendar invites immediately after confirmation
- Include agenda and materials in the invite
- Send reminder 24 hours and 1 hour before
- Offer 2-3 time options when possible
- Record decisions and action items
