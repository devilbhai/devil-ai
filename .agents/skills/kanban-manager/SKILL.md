---
name: kanban-manager
description: Kanban board systems. Workflow visualization, WIP limits, flow optimization.
---

# Kanban Manager

## When to Apply
Use this skill when designing Kanban boards, setting WIP limits, optimizing workflow flow, or visualizing work progress.

## Core Concepts
- Columns: represent workflow stages (To Do, In Progress, Done)
- WIP limits: cap items per column to prevent overload
- Pull system: only start new work when capacity exists
- Cycle time: time from start to completion
- Throughput: items completed per time period

## Implementation

```typescript
interface KanbanBoard {
  columns: KanbanColumn[]
  cards: KanbanCard[]
}

interface KanbanColumn {
  id: string
  name: string
  wipLimit: number
  cards: string[]
}

interface KanbanCard {
  id: string
  title: string
  column: string
  assignee?: string
  priority: "low" | "medium" | "high"
  createdAt: Date
  movedAt: Date
  labels: string[]
}

function canAddCard(board: KanbanBoard, columnId: string): boolean {
  const column = board.columns.find(c => c.id === columnId)
  if (!column) return false
  return column.cards.length < column.wipLimit
}

function moveCard(
  board: KanbanBoard,
  cardId: string,
  targetColumnId: string
): KanbanBoard | null {
  if (!canAddCard(board, targetColumnId)) return null

  const card = board.cards.find(c => c.id === cardId)
  if (!card) return null

  return {
    ...board,
    cards: board.cards.map(c =>
      c.id === cardId ? { ...c, column: targetColumnId, movedAt: new Date() } : c
    ),
  }
}

function calculateMetrics(board: KanbanBoard): FlowMetrics {
  const cycleTimes = board.cards
    .filter(c => c.column === "done")
    .map(c => c.movedAt.getTime() - c.createdAt.getTime())

  return {
    averageCycleTime: cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length,
    throughput: cycleTimes.length,
    wipCount: board.cards.filter(c => c.column !== "todo" && c.column !== "done").length,
  }
}
```

## Best Practices
- Start with WIP limits of 3-5 per column
- Review and adjust limits based on flow
- Visualize blockers prominently
- Use swimlanes for different work types
- Track cycle time trends
- Limit work in progress above all else
