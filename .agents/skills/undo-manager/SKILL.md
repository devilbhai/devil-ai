---
name: undo-manager
description: Undo/redo systems. Change tracking, state management, history navigation.
---

# Undo Manager

## When to Apply
Use this skill when implementing undo/redo functionality in applications, tracking file changes, or managing reversible state transitions.

## Core Concepts
- **Command pattern**: Encapsulate changes as reversible operations
- **State snapshots**: Store full state at each checkpoint
- **Diff-based tracking**: Record only what changed
- **History stack**: Push/pop pattern for undo/redo navigation
- **Branch history**: Support branching timelines (like git)

## Implementation
```typescript
interface UndoState<T> {
  past: T[]
  present: T
  future: T[]
}

function undoReducer<T>(state: UndoState<T>, action: "undo" | "redo" | "new") {
  switch (action) {
    case "undo":
      if (state.past.length === 0) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      }
    case "redo":
      if (state.future.length === 0) return state
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      }
    case "new":
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: [],
      }
  }
}
```

## Best Practices
- Limit history depth to prevent memory issues (100-500 entries)
- Group related changes into single undo steps
- Use diff-based tracking for large state objects
- Provide visual indicators of undo/redo availability
- Persist critical undo history to survive page reloads
- Distinguish between user actions and programmatic state changes
