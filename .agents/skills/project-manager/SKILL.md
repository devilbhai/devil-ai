---
name: project-manager
description: Project management. Task tracking, milestone planning, resource allocation.
---

# Project Manager

## When to Apply
Use this skill when managing projects, tracking tasks, planning milestones, or allocating resources.

## Core Concepts
- Task breakdown: divide work into manageable pieces
- Milestones: key checkpoints in project timeline
- Dependencies: tasks that must complete before others start
- Resource allocation: assign people to tasks based on capacity
- Progress tracking: percentage complete, burndown charts

## Implementation

```typescript
interface Project {
  id: string
  name: string
  tasks: Task[]
  milestones: Milestone[]
  startDate: Date
  endDate: Date
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "review" | "done"
  assignee?: string
  estimate: number // hours
  dependencies: string[]
  milestone?: string
}

interface Milestone {
  id: string
  name: string
  dueDate: Date
  tasks: string[]
}

function calculateProgress(project: Project): number {
  const completed = project.tasks.filter(t => t.status === "done").length
  return Math.round((completed / project.tasks.length) * 100)
}

function identifyCriticalPath(project: Project): string[] {
  const dependencyGraph = buildDependencyGraph(project.tasks)
  return findLongestPath(dependencyGraph)
}

function allocateResources(
  tasks: Task[],
  team: TeamMember[]
): Map<string, string[]> {
  const allocation = new Map<string, string[]>()

  for (const member of team) {
    const assigned = tasks
      .filter(t => t.assignee === member.id)
      .map(t => t.id)
    allocation.set(member.id, assigned)
  }

  return allocation
}
```

## Best Practices
- Break tasks into chunks under 8 hours
- Define clear acceptance criteria
- Track dependencies to prevent bottlenecks
- Update task status daily
- Hold brief standups for alignment
- Review and adjust timelines weekly
