---
name: performance-optimizer
description: Performance optimization. Bottleneck identification, profiling, optimization strategies.
---

# Performance Optimizer

## When to Apply
Use this skill when optimizing performance: identifying bottlenecks, profiling code execution, or applying optimization strategies to improve speed and efficiency.

## Core Concepts
- Profiling: measuring where time is spent in code execution
- Bottlenecks: code sections that limit overall throughput
- Memoization: caching results of expensive function calls
- Lazy loading: deferring initialization until needed
- Algorithmic optimization: reducing time/space complexity (O(n) -> O(log n))

## Implementation

### Node.js Profiling
```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Chrome DevTools profiling
node --inspect app.js
# Open chrome://inspect in Chrome

# CPU flame graphs
node --cpu-prof app.js
```

### Performance Measurement
```typescript
function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${label}: ${(end - start).toFixed(2)}ms`)
  return result
}

// Async version
async function measureAsync<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  console.log(`${label}: ${(end - start).toFixed(2)}ms`)
  return result
}
```

### Memoization
```typescript
function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T
}
```

### Lazy Loading
```typescript
// Lazy module import
const HeavyModule = await import("./heavy-module")

// Lazy component rendering
const LazyComponent = React.lazy(() => import("./LazyComponent"))

// Lazy initialization
class ExpensiveService {
  private instance: Service | null = null
  getInstance(): Service {
    if (!this.instance) this.instance = new Service()
    return this.instance
  }
}
```

### Common Optimizations
```typescript
// BAD: N+1 queries
const users = await getUsers()
for (const user of users) {
  user.posts = await getPostsByUser(user.id) // N queries
}

// GOOD: Batch query
const users = await getUsers()
const userIds = users.map((u) => u.id)
const posts = await getPostsByUserIds(userIds) // 1 query
```

## Best Practices
- Profile before optimizing - measure, don't guess
- Focus on hot paths that execute most frequently
- Use `performance.now()` for precise timing, not `Date.now()`
- Benchmark optimizations to ensure they actually improve performance
- Consider memory vs CPU trade-offs (caching uses memory to save CPU)
- Use `--max-old-space-size` to prevent OOM in Node.js
