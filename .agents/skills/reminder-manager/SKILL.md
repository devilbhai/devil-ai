---
name: reminder-manager
description: Reminder systems. Notification scheduling, recurring reminders, smart reminders.
---

# Reminder Manager

## When to Apply
Use this skill when creating reminder systems, scheduling notifications, or designing smart reminder logic.

## Core Concepts
- Reminder types: one-time, recurring, location-based, conditional
- Notification channels: push, email, SMS, in-app
- Snooze handling: reschedule with smart intervals
- Context awareness: adapt reminders based on behavior
- Priority levels: critical, important, informational

## Implementation

```typescript
interface Reminder {
  id: string
  title: string
  description?: string
  triggerTime: Date
  recurrence?: RecurrenceRule
  channel: "push" | "email" | "sms" | "in-app"
  priority: "critical" | "important" | "informational"
  snoozeCount: number
  maxSnoozes: number
}

interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
}

function scheduleReminder(reminder: Reminder): void {
  const delay = reminder.triggerTime.getTime() - Date.now()
  if (delay < 0) return

  setTimeout(() => {
    sendNotification(reminder)
  }, delay)
}

function handleSnooze(reminder: Reminder, duration: number): Reminder {
  if (reminder.snoozeCount >= reminder.maxSnoozes) {
    return { ...reminder, triggerTime: new Date() } // force completion
  }
  return {
    ...reminder,
    triggerTime: new Date(Date.now() + duration),
    snoozeCount: reminder.snoozeCount + 1,
  }
}

function createRecurringReminder(base: Reminder, rule: RecurrenceRule): Reminder[] {
  const reminders: Reminder[] = []
  let current = base.triggerTime

  while (!rule.endDate || current <= rule.endDate) {
    reminders.push({ ...base, triggerTime: current })
    current = getNextOccurrence(current, rule)
  }

  return reminders
}
```

## Best Practices
- Allow customization of notification channels
- Implement snooze with increasing intervals
- Group related reminders to reduce noise
- Support natural language input ("tomorrow at 9am")
- Provide easy way to view and manage all reminders
- Respect user's quiet hours
