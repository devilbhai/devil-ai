---
name: predictive-actions
description: Predictive automation. Action prediction, workflow anticipation, smart defaults.
---

# Predictive Actions

## When to Apply
Use this skill when building features that anticipate user needs, auto-suggest next steps, or automate repetitive workflows.

## Core Concepts
- **Action prediction**: Model likely next actions from context
- **Workflow patterns**: Detect and automate repeated sequences
- **Smart defaults**: Pre-fill forms based on historical data
- **Time-based triggers**: Automate actions at specific times or conditions
- **Confidence scoring**: Quantify prediction certainty before acting

## Implementation
```typescript
interface ActionPattern {
  action: string
  context: string[]
  frequency: number
  lastUsed: number
}

function predictNext(
  recentActions: string[],
  patterns: ActionPattern[]
): ActionPattern[] {
  const context = recentActions.slice(-3)
  return patterns
    .filter((p) => context.some((c) => p.context.includes(c)))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3)
}

// Smart defaults from history
function inferDefaults(history: Record<string, unknown>[]) {
  const defaults: Record<string, unknown> = {}
  for (const key of Object.keys(history[0] ?? {})) {
    const values = history.map((h) => h[key]).filter(Boolean)
    defaults[key] = mostFrequent(values)
  }
  return defaults
}

function mostFrequent<T>(arr: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const item of arr) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}
```

## Best Practices
- Collect action data passively — don't interrupt user flow
- Require explicit confirmation for high-impact automated actions
- Allow users to dismiss or customize predicted actions
- Track prediction accuracy to improve models over time
- Provide transparency — explain why an action was suggested
- Respect privacy — anonymize usage data for prediction models
