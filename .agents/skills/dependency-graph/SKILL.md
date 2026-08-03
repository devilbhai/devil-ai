---
name: dependency-graph
description: Analyze and visualize code dependencies, imports, and module relationships.
---

# Dependency Graph

## When to Apply
Use this skill when analyzing module dependencies, finding circular imports, visualizing architecture, or planning refactoring.

## Core Concepts
- Import/export analysis
- Circular dependency detection
- Dependency depth calculation
- Module coupling metrics
- Architecture visualization

## Implementation

### Build Dependency Graph
```typescript
interface DependencyNode {
  file: string
  imports: string[]
  exports: string[]
  externalDeps: string[]
  depth: number
}

function buildDependencyGraph(root: string): Map<string, DependencyNode> {
  const graph = new Map<string, DependencyNode>()
  // Walk directory, parse imports, build graph
  return graph
}
```

### Detect Circular Dependencies
```typescript
function detectCycles(graph: Map<string, DependencyNode>): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const stack = new Set<string>()
  
  function dfs(node: string, path: string[]) {
    if (stack.has(node)) {
      cycles.push([...path, node])
      return
    }
    if (visited.has(node)) return
    
    visited.add(node)
    stack.add(node)
    path.push(node)
    
    for (const dep of graph.get(node)?.imports || []) {
      dfs(dep, [...path])
    }
    
    stack.delete(node)
  }
  
  for (const node of graph.keys()) {
    dfs(node, [])
  }
  
  return cycles
}
```

### Metrics
- **Fan-in**: Number of modules that import this module
- **Fan-out**: Number of modules this module imports
- **Instability**: fan-out / (fan-in + fan-out)
- **Abstractness**: ratio of abstract classes to total

## Best Practices
- Visualize as directed graph (Graphviz, Mermaid)
- Highlight circular dependencies in red
- Group by layer (presentation, business, data)
- Keep graph depth under 5 levels
- Target main module for low instability
