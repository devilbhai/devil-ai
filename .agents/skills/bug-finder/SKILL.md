---
name: bug-finder
description: Bug detection patterns. Static analysis, pattern matching, common bug detection.
---

# Bug Finder

## When to Apply
Use this skill when detecting bugs: applying static analysis patterns, matching known bug signatures, or identifying common programming mistakes.

## Core Concepts
- Null/undefined handling: optional chaining, nullish coalescing
- Async bugs: unhandled rejections, race conditions, stale closures
- Memory leaks: event listener accumulation, timer leaks, closure retention
- Off-by-one errors: loop boundaries, array indexing
- Type coercion: implicit conversions in comparisons

## Implementation

### Null Safety Patterns
```typescript
// BAD: Potential null dereference
const user = getUser()
const name = user.name

// GOOD: Safe access
const name = user?.name ?? "Unknown"

// GOOD: Explicit null check
if (user === null || user === undefined) {
  throw new Error("User not found")
}
const name = user.name
```

### Async Bug Detection
```typescript
// BAD: Unhandled rejection
async function fetchData() {
  const result = await riskyOperation() // No try/catch
}

// GOOD: Proper error handling
async function fetchData() {
  try {
    const result = await riskyOperation()
    return result
  } catch (err) {
    logger.error("Failed to fetch data", { err })
    throw err
  }
}
```

### Race Condition Prevention
```typescript
// BAD: Race condition
let cachedData: Data | null = null
async function getData() {
  if (!cachedData) cachedData = await fetchData() // Multiple calls race
  return cachedData
}

// GOOD: Serialize with mutex
let pending: Promise<Data> | null = null
async function getData() {
  if (!pending) pending = fetchData().finally(() => (pending = null))
  return pending
}
```

### Common Pattern Scans
```bash
# Find potential memory leaks (event listeners without cleanup)
grep -rn "\.addEventListener(" --include="*.ts" --include="*.tsx" | grep -v "removeEventListener"

# Find unhandled promises
grep -rn "\.then(" --include="*.ts" | grep -v "\.catch("

# Find console.log in production code
grep -rn "console\.\(log\|debug\|info\)" --include="*.ts" --include="*.tsx" src/

# Find TODO/FIXME/HACK markers
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" src/
```

### Type Safety Checks
```typescript
// BAD: Type assertion hides bugs
const data = response.data as User

// GOOD: Runtime validation with Zod
import { z } from "zod"
const UserSchema = z.object({ id: z.string(), name: z.string() })
const data = UserSchema.parse(response.data)
```

## Best Practices
- Enable TypeScript strict mode (`strict: true` in tsconfig)
- Use `noUncheckedIndexedAccess` for array/object access
- Add `@typescript-eslint/no-floating-promises` lint rule
- Review all `catch` blocks to ensure errors aren't silently swallowed
- Use `Promise.allSettled()` over `Promise.all()` for independent async operations
- Profile memory usage periodically to detect leaks early
