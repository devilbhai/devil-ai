---
name: time-tracker
description: Time tracking. Activity monitoring, productivity analysis, reporting.
---

# Time Tracker

## When to Apply
Use this skill when tracking time spent on tasks, monitoring activity patterns, analyzing productivity, or generating time reports.

## Core Concepts
- Time entries: start time, end time, category, description
- Categories: project, client, task type
- Pomodoro technique: 25min work, 5min break
- Productivity metrics: focus score, distraction count
- Reporting: daily, weekly, monthly summaries

## Implementation

```typescript
interface TimeEntry {
  id: string
  task: string
  project: string
  category: string
  startTime: Date
  endTime?: Date
  tags: string[]
  notes?: string
}

function calculateDuration(entry: TimeEntry): number {
  const end = entry.endTime ?? new Date()
  return (end.getTime() - entry.startTime.getTime()) / (1000 * 60) // minutes
}

function generateDailyReport(entries: TimeEntry[], date: Date): DailyReport {
  const dayEntries = entries.filter(e => isSameDay(e.startTime, date))
  const byProject = groupBy(dayEntries, "project")
  const byCategory = groupBy(dayEntries, "category")

  const totalMinutes = dayEntries.reduce((sum, e) => sum + calculateDuration(e), 0)

  return {
    date,
    totalHours: totalMinutes / 60,
    projectBreakdown: Object.entries(byProject).map(([project, items]) => ({
      project,
      hours: items.reduce((sum, e) => sum + calculateDuration(e), 0) / 60,
    })),
    categoryBreakdown: Object.entries(byCategory).map(([category, items]) => ({
      category,
      hours: items.reduce((sum, e) => sum + calculateDuration(e), 0) / 60,
    })),
  }
}

function analyzeProductivity(entries: TimeEntry[]): ProductivityMetrics {
  const focusBlocks = detectFocusBlocks(entries)
  return {
    focusScore: calculateFocusScore(focusBlocks),
    averageSessionLength: averageDuration(focusBlocks),
    totalProductiveHours: sumDurations(focusBlocks),
  }
}
```

## Best Practices
- Track time in real-time, not from memory
- Use consistent categories across projects
- Review weekly for patterns and improvements
- Set time estimates and compare to actuals
- Minimize context switching between tasks
- Use timers to stay focused during work blocks
