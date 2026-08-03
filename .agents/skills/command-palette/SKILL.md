---
name: command-palette
description: Command palette implementation. Fuzzy search, command grouping, keyboard navigation.
---

# Command Palette

## When to Apply
Use this skill when building command palettes, quick-action menus, or keyboard-driven command interfaces.

## Core Concepts
- **Fuzzy search**: Substring and fuzzy matching for fast filtering
- **Command registry**: Centralized command definitions with metadata
- **Grouping**: Organize commands by category (file, edit, view, etc.)
- **Keyboard navigation**: Arrow keys, enter to execute, escape to close
- **Recency ranking**: Prioritize recently used commands

## Implementation
```typescript
interface Command {
  id: string
  label: string
  group: string
  shortcut?: string
  action: () => void
  enabled?: boolean
}

function fuzzyFilter(query: string, commands: Command[]): Command[] {
  if (!query) return commands
  const lower = query.toLowerCase()
  return commands
    .filter((cmd) => {
      const label = cmd.label.toLowerCase()
      let qi = 0
      for (let i = 0; i < label.length && qi < lower.length; i++) {
        if (label[i] === lower[qi]) qi++
      }
      return qi === lower.length
    })
    .sort((a, b) => {
      const aMatch = a.label.toLowerCase().indexOf(lower)
      const bMatch = b.label.toLowerCase().indexOf(lower)
      return (aMatch === -1 ? Infinity : aMatch) - (bMatch === -1 ? Infinity : bMatch)
    })
}

// Group commands by category
function groupCommands(commands: Command[]): Map<string, Command[]> {
  const groups = new Map<string, Command[]>()
  for (const cmd of commands) {
    const existing = groups.get(cmd.group) ?? []
    existing.push(cmd)
    groups.set(cmd.group, existing)
  }
  return groups
}
```

## Best Practices
- Open palette with `Cmd+K` / `Ctrl+K` (industry standard)
- Keep command labels short and descriptive
- Support immediate execution on exact match
- Show keyboard shortcuts alongside commands
- Remember last N used commands for quick access
- Support `>` prefix for special commands (like git branch)
