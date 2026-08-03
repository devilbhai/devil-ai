---
name: debugging
description: Debugging techniques, console tools, React DevTools, performance profiling, and error investigation for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Debugging Patterns

Debugging techniques and tools for the Devil AI codebase.

## When to Apply

- Investigating bugs
- Performance issues
- Memory leaks
- Console errors
- React component issues

---

## 1. Console Techniques

### Console Methods

```typescript
// ✅ Basic logging
console.log("Standard log")
console.info("Info message")
console.warn("Warning message")
console.error("Error message")

// ✅ Object inspection
console.log("User:", user)
console.dir(user, { depth: null, colors: true })

// ✅ Table format
console.table(users)

// ✅ Group related logs
console.group("User Operations")
console.log("Creating user")
console.log("User created")
console.groupEnd()

// ✅ Timing
console.time("fetchData")
await fetchData()
console.timeEnd("fetchData")

// ✅ Count calls
console.count("fetchCall")
await fetch("/api/data")
console.count("fetchCall")

// ✅ Stack trace
console.trace("Function called")

// ✅ Conditional logging
console.assert(users.length > 0, "Users array is empty")

// ✅ Clear console
console.clear()
```

### Debug Levels

```typescript
// ✅ Debug with levels
const DEBUG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const

const currentLevel = DEBUG_LEVELS.INFO

function debug(level: keyof typeof DEBUG_LEVELS, ...args: unknown[]) {
  if (DEBUG_LEVELS[level] <= currentLevel) {
    const prefix = `[${level}]`
    if (level === "ERROR") {
      console.error(prefix, ...args)
    } else if (level === "WARN") {
      console.warn(prefix, ...args)
    } else {
      console.log(prefix, ...args)
    }
  }
}

// Usage
debug("INFO", "User created:", user)
debug("DEBUG", "Fetching data from:", url)
```

---

## 2. React DevTools

### Component Inspection

```
1. Open React DevTools (F12 → Components tab)
2. Use search to find components
3. Check props, state, hooks
4. Profile performance
```

### Useful Hooks

```typescript
// ✅ Add component name for debugging
function UserProfile({ userId }: { userId: string }) {
  console.log("UserProfile rendered:", userId)
  
  return <div>{/* ... */}</div>
}

// ✅ Log state changes
function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log("Count changed:", count)
  }, [count])
  
  return <div>{count}</div>
}
```

### Performance Profiling

```typescript
// ✅ React.Profiler for performance
import { Profiler } from "react"

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`[${id}] ${phase}:`, {
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  })
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <UserProfile />
    </Profiler>
  )
}
```

---

## 3. Browser DevTools

### Network Tab

```
1. Open DevTools → Network tab
2. Filter by XHR/Fetch for API calls
3. Check request/response headers
4. Look for failed requests (red)
5. Check timing for slow requests
```

### Performance Tab

```
1. Open DevTools → Performance tab
2. Click Record
3. Perform actions
4. Stop recording
5. Analyze:
   - FPS (frames per second)
   - CPU usage
   - Memory usage
   - Long tasks
```

### Memory Tab

```
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare snapshots to find memory leaks
```

### Console Tab

```typescript
// ✅ Filter console output
// Use filter box to search for specific messages
// Use levels: Errors, Warnings, Info, Verbose

// ✅ Copy console output
// Right-click → Save as...

// ✅ Copy object as JS
// Right-click → Copy object as JavaScript
```

---

## 4. Node.js Debugging

### Debug Mode

```bash
# Run with debug flag
node --inspect your-file.js

# Run with break on first line
node --inspect-brk your-file.js

# Run Bun with debug
bun --inspect your-file.js
```

### VS Code Launch Config

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Bun",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "program": "${workspaceFolder}/src/index.ts",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Logging in Main Process

```typescript
// ✅ Structured logging
function createLogger(context: string) {
  return {
    info: (message: string, data?: unknown) => {
      console.log(`[${context}] ${message}`, data ?? "")
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`[${context}] ${message}`, data ?? "")
    },
    error: (message: string, error?: unknown) => {
      console.error(`[${context}] ${message}`, error)
    },
    debug: (message: string, data?: unknown) => {
      if (process.env.DEBUG) {
        console.log(`[${context}] ${message}`, data ?? "")
      }
    },
  }
}

// Usage
const logger = createLogger("IPC")
logger.info("Handler registered:", channel)
```

---

## 5. Common Issues

### React Re-renders

```typescript
// ✅ Debug unnecessary re-renders
function Component({ prop1, prop2 }: Props) {
  console.log("Component rendered")
  
  return <div>{/* ... */}</div>
}

// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
}: {
  data: Data
}) {
  console.log("ExpensiveComponent rendered")
  
  // Heavy computation
  const result = useMemo(() => computeExpensiveValue(data), [data])
  
  return <div>{result}</div>
})
```

### Memory Leaks

```typescript
// ✅ Clean up subscriptions
function useSubscription(url: string) {
  useEffect(() => {
    const eventSource = new EventSource(url)
    
    eventSource.onmessage = (event) => {
      // Handle message
    }
    
    // Cleanup
    return () => {
      eventSource.close()
    }
  }, [url])
}

// ✅ Clean up timers
function useTimer() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Timer logic
    }, 1000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])
}
```

### Async Errors

```typescript
// ✅ Handle unhandled rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
  event.preventDefault()
})

// ✅ Handle global errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error)
})

// ✅ Wrap async functions
async function safeAsync<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    console.error("Async error:", error)
    return null
  }
}
```

---

## 6. Debugging Tools

### React Query DevTools

```typescript
// ✅ Add React Query DevTools
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Jotai DevTools

```typescript
// ✅ Add Jotai DevTools
import { useAtomsDevtools } from "jotai-devtools"

function App() {
  useAtomsDevtools("Devil AI")
  return <AppContent />
}
```

### Why Did You Render

```typescript
// ✅ Track re-renders
if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render")
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  })
}
```

---

## 7. Error Boundaries

### Basic Error Boundary

```typescript
// ✅ components/error-boundary.tsx
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-2">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Try again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

### Usage

```tsx
// ✅ Wrap components with error boundary
function App() {
  return (
    <ErrorBoundary
      fallback={<div>Failed to load app</div>}
      onError={(error, info) => {
        console.error("App error:", error, info)
        // Send to error tracking service
      }}
    >
      <AppContent />
    </ErrorBoundary>
  )
}

// ✅ Wrap specific features
function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<div>Failed to load chart</div>}>
        <Chart />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div>Failed to load table</div>}>
        <DataTable />
      </ErrorBoundary>
    </div>
  )
}
```

---

## 8. Performance Debugging

### Identify Slow Components

```typescript
// ✅ Use React Profiler
import { Profiler } from "react"

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number
) {
  if (actualDuration > 16) { // More than one frame
    console.warn(`[${id}] Slow render: ${actualDuration}ms`)
  }
}

// ✅ Use console.time
function SlowComponent() {
  console.time("SlowComponent")
  
  const result = useMemo(() => {
    // Expensive computation
    return computeExpensiveValue()
  }, [])
  
  console.timeEnd("SlowComponent")
  
  return <div>{result}</div>
}
```

### Bundle Analysis

```bash
# Analyze bundle size
bun run build --analyze

# Visualize bundle
npx vite-bundle-visualizer
```

### Lighthouse

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --output=html
```

---

## 9. Debug Checklist

### Before Debugging

- [ ] Reproduce the issue consistently
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Check React DevTools for component issues
- [ ] Check if issue is in dev or production

### During Debugging

- [ ] Add console logs strategically
- [ ] Use breakpoints in DevTools
- [ ] Check state and props at each step
- [ ] Verify data is correct at each stage
- [ ] Check for race conditions

### After Debugging

- [ ] Remove all debug logs
- [ ] Add error handling if needed
- [ ] Write test to prevent regression
- [ ] Document the issue and solution
- [ ] Consider if similar issues exist elsewhere

---

## Best Practices

1. **Use console methods strategically** — Don't just use `console.log`
2. **Add meaningful labels** — Include context in log messages
3. **Clean up debug code** — Remove before committing
4. **Use breakpoints** — More effective than console logs
5. **Check the obvious first** — Typos, null values, wrong types
6. **Isolate the problem** — Comment out code to narrow scope
7. **Check recent changes** — Most bugs are in recent commits
8. **Read error messages carefully** — They often tell you exactly what's wrong
9. **Search for similar issues** — Someone likely had the same problem
10. **Take breaks** — Fresh eyes spot bugs faster
