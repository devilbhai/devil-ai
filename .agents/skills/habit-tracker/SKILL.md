---
name: habit-tracker
description: Habit formation, streak tracking, consistency analysis, and behavior change support.
---

# Habit Tracker

## When to Apply
Use this skill when building habits, tracking streaks, analyzing consistency, or designing behavior change systems.

## Core Concepts
- Habit stacking
- Streak tracking
- Consistency metrics
- Habit clustering
- Progress visualization

## Implementation

### Habit Definition
```typescript
interface Habit {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly" | "custom"
  targetCount: number
  category: string
  cue: string        // trigger
  routine: string    // action
  reward: string     // benefit
  createdAt: Date
}

interface HabitLog {
  habitId: string
  date: Date
  completed: boolean
  value?: number     // optional quantification
  notes?: string
}
```

### Streak Calculation
```typescript
interface StreakInfo {
  current: number
  longest: number
  total: number
  completionRate: number
}

function calculateStreak(logs: HabitLog[]): StreakInfo {
  const sorted = logs
    .filter(l => l.completed)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
  
  let current = 0
  let longest = 0
  let tempStreak = 0
  
  // Calculate streaks by checking consecutive days
  // Return current and longest streaks
}
```

### Consistency Score
```typescript
function calculateConsistency(
  logs: HabitLog[],
  startDate: Date,
  endDate: Date
): number {
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const completedDays = logs.filter(l => l.completed).length
  return completedDays / totalDays
}
```

### Habit Clusters
```typescript
interface HabitCluster {
  name: string
  habits: string[]
  synergy: number     // how much they reinforce each other
  bestTime: "morning" | "afternoon" | "evening"
}
```

## Habit Formation Tips
1. Start with 2-minute version
2. Stack after existing habit
3. Design environment for success
4. Track immediately after action
5. Never miss twice in a row
6. Celebrate small wins

## Best Practices
- Focus on 3-5 habits maximum
- Make habits specific and measurable
- Review and adjust monthly
- Use visual streaks for motivation
- Build accountability system
