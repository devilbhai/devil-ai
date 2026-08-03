---
name: architecture-reviewer
description: Architecture analysis. Design pattern detection, coupling analysis, modularity assessment.
---

# Architecture Reviewer

## When to Apply
Use this skill when reviewing architecture: detecting design patterns, analyzing module coupling, assessing modularity, or evaluating system design decisions.

## Core Concepts
- Coupling: degree of interdependence between modules (low coupling = good)
- Cohesion: degree to which elements within a module belong together (high cohesion = good)
- SRP: Single Responsibility Principle - one reason to change
- DIP: Dependency Inversion Principle - depend on abstractions
- Layered architecture: presentation, business logic, data access separation

## Implementation

### Dependency Analysis
```bash
# Find circular dependencies
npx madge --circular --extensions ts,tsx src/

# Generate dependency graph
npx madge --image deps.svg src/

# Check import depth (indicating deep coupling)
grep -rn "^import" --include="*.ts" src/ | awk -F: '{print $1}' | sort | uniq -c | sort -rn
```

### Module Boundary Enforcement
```typescript
// BAD: Cross-layer import
// controller.ts importing from repository.ts directly

// GOOD: Service layer abstraction
// controller.ts -> service.ts -> repository.ts
import { UserService } from "../services/user.service"

// Enforce with eslint-plugin-import
// {
//   "rules": {
//     "import/no-restricted-paths": ["error", {
//       "zones": [{ "target": "./src/controller", "from": "./src/repository" }]
//     }]
//   }
// }
```

### Design Pattern Detection
```bash
# Singleton pattern (global state)
grep -rn "export const.*= new " --include="*.ts" src/

# Factory pattern
grep -rn "function create\|class.*Factory" --include="*.ts" src/

# Observer pattern
grep -rn "EventEmitter\|\.on(\|\.emit(" --include="*.ts" src/
```

### Complexity Metrics
```typescript
interface ModuleMetrics {
  name: string
  linesOfCode: number
  dependencies: number
  dependents: number
  cyclomaticComplexity: number
  cohesionScore: number
}

function analyzeModule(filePath: string): ModuleMetrics {
  // Count imports, functions, classes
  // Calculate complexity metrics
  return {
    name: filePath,
    linesOfCode: 0,
    dependencies: 0,
    dependents: 0,
    cyclomaticComplexity: 0,
    cohesionScore: 0,
  }
}
```

### Architecture Review Checklist
```markdown
- [ ] No circular dependencies between modules
- [ ] Each module has a single, clear responsibility
- [ ] Business logic is independent of framework details
- [ ] Dependencies flow inward (outer layers depend on inner)
- [ ] Interfaces are small and focused (ISP)
- [ ] No god objects or god modules
- [ ] Configuration is externalized
```

## Best Practices
- Enforce module boundaries with lint rules, not just conventions
- Use dependency injection to decouple creation from usage
- Review architecture decisions with ADRs (Architecture Decision Records)
- Monitor dependency graphs over time to detect degradation
- Keep domain models independent of infrastructure concerns
