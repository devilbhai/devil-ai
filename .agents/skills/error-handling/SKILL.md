---
name: error-handling
description: Error boundaries, try/catch patterns, graceful degradation, tagged logging, and error recovery for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Error Handling Patterns

Error handling patterns for the Devil AI codebase.

## When to Apply

- Handling runtime errors
- Creating error boundaries
- Implementing retry logic
- Logging errors
- Building resilient systems

---

## 1. Error Types

### Custom Error Classes

```typescript
// ✅ Base application error
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

// ✅ Specific error types
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404
    )
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400, { fields: details })
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super("Rate limit exceeded", "RATE_LIMIT", 429, { retryAfter })
  }
}
```

### Error Result Type

```typescript
// ✅ Result type for explicit error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// ✅ Helper functions
export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

// ✅ Usage
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero")
  }
  return ok(a / b)
}

const result = divide(10, 2)
if (result.success) {
  console.log(result.data) // 5
} else {
  console.error(result.error) // "Division by zero"
}
```

---

## 2. Try/Catch Patterns

### Basic Pattern

```typescript
// ✅ Basic try/catch
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`)
    
    if (!response.ok) {
      throw new AppError("User not found", "NOT_FOUND", 404)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return null
  }
}
```

### Typed Error Handling

```typescript
// ✅ Typed error handling
async function apiCall<T>(url: string): Promise<Result<T, AppError>> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return err(
        new AppError(
          errorData.message || "Request failed",
          errorData.code || "API_ERROR",
          response.status
        )
      )
    }
    
    const data = await response.json()
    return ok(data)
  } catch (error) {
    if (error instanceof AppError) {
      return err(error)
    }
    
    return err(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        "NETWORK_ERROR",
        500
      )
    )
  }
}

// Usage
const result = await apiCall<User>("/api/users/123")
if (result.success) {
  console.log(result.data)
} else {
  console.error(result.error.code, result.error.message)
}
```

### Cleanup Pattern

```typescript
// ✅ Cleanup in finally
async function processFile(path: string): Promise<void> {
  let fileHandle: FileHandle | null = null
  
  try {
    fileHandle = await open(path, "r")
    const content = await fileHandle.readFile("utf-8")
    await processContent(content)
  } catch (error) {
    console.error("Failed to process file:", error)
    throw error
  } finally {
    if (fileHandle) {
      await fileHandle.close()
    }
  }
}
```

---

## 3. Error Boundaries

### React Error Boundary

```typescript
// ✅ components/error-boundary.tsx
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
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
  
  reset = () => {
    this.setState({ hasError: false, error: null })
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.reset)
      }
      
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-2">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
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

### Error Boundary Hierarchy

```tsx
// ✅ Nested error boundaries
function App() {
  return (
    <ErrorBoundary fallback={<div>App failed to load</div>}>
      <Layout>
        <ErrorBoundary fallback={<div>Content failed to load</div>}>
          <MainContent />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<div>Sidebar failed to load</div>}>
          <Sidebar />
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  )
}
```

---

## 4. Retry Logic

### Simple Retry

```typescript
// ✅ Basic retry
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await Bun.sleep(delay)
    }
  }
  
  throw new Error("Max retries exceeded")
}
```

### Exponential Backoff

```typescript
// ✅ Exponential backoff
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 30000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      )
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await Bun.sleep(delay)
    }
  }
  
  throw new Error("Max retries exceeded")
}
```

### Conditional Retry

```typescript
// ✅ Retry only specific errors
async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (
        attempt === maxRetries ||
        !(error instanceof Error) ||
        !shouldRetry(error)
      ) {
        throw error
      }
      
      console.warn(`Attempt ${attempt} failed, retrying...`)
      await Bun.sleep(delay)
    }
  }
  
  throw new Error("Max retries exceeded")
}

// Usage
await withConditionalRetry(
  () => fetch("/api/data"),
  (error) => error.message.includes("503") || error.message.includes("timeout"),
  3,
  1000
)
```

---

## 5. Error Logging

### Tagged Logger

```typescript
// ✅ Tagged logger
function createLogger(tag: string) {
  return {
    info: (message: string, data?: unknown) => {
      console.log(`[${tag}] ${message}`, data ?? "")
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`[${tag}] ${message}`, data ?? "")
    },
    error: (message: string, error?: unknown) => {
      console.error(`[${tag}] ${message}`, error)
    },
    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[${tag}] ${message}`, data ?? "")
      }
    },
  }
}

// Usage
const logger = createLogger("UserService")
logger.error("Failed to create user", error)
```

### Structured Logging

```typescript
// ✅ Structured error logging
interface LogEntry {
  level: "info" | "warn" | "error" | "debug"
  message: string
  timestamp: string
  context: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, unknown>
}

function log(entry: Omit<LogEntry, "timestamp">): void {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }
  
  console.log(JSON.stringify(fullEntry))
}

// Usage
log({
  level: "error",
  message: "Failed to fetch user",
  context: "UserService.fetchUser",
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: "FETCH_ERROR",
  },
  metadata: { userId: "123", url: "/api/users/123" },
})
```

### Error Reporting

```typescript
// ✅ Send errors to reporting service
async function reportError(error: Error, context: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
        metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    })
  } catch (reportingError) {
    console.error("Failed to report error:", reportingError)
  }
}
```

---

## 6. Graceful Degradation

### Fallback UI

```tsx
// ✅ Fallback for failed components
function UserAvatar({ userId }: { userId: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    fetchAvatar(userId)
      .then(setAvatarUrl)
      .catch(() => setError(true))
  }, [userId])
  
  if (error || !avatarUrl) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-sm">?</span>
      </div>
    )
  }
  
  return <img src={avatarUrl} alt="User avatar" className="w-10 h-10 rounded-full" />
}
```

### Feature Flags

```typescript
// ✅ Disable features on error
function FeatureComponent() {
  const [isBroken, setIsBroken] = useState(false)
  
  if (isBroken) {
    return <div className="text-gray-500">Feature temporarily unavailable</div>
  }
  
  return (
    <ErrorBoundary
      onError={() => setIsBroken(true)}
      fallback={<div>Feature failed to load</div>}
    >
      <ActualFeature />
    </ErrorBoundary>
  )
}
```

### Offline Support

```typescript
// ✅ Handle offline state
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])
  
  return isOnline
}

// Usage
function App() {
  const isOnline = useOnlineStatus()
  
  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 p-2 text-center text-sm">
          You are offline. Some features may be unavailable.
        </div>
      )}
      <MainContent />
    </div>
  )
}
```

---

## 7. Promise Handling

### Safe Promise

```typescript
// ✅ Safe promise execution
async function safePromise<T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

// Usage
const [user, error] = await safePromise(fetchUser(id))
if (error) {
  console.error("Failed to fetch user:", error)
} else {
  console.log(user)
}
```

### Promise.allSettled Handling

```typescript
// ✅ Handle multiple promises
async function fetchMultiple(urls: string[]): Promise<(Data | null)[]> {
  const results = await Promise.allSettled(
    urls.map((url) => fetch(url).then((r) => r.json()))
  )
  
  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value
    }
    
    console.error("Request failed:", result.reason)
    return null
  })
}
```

### Promise Race with Timeout

```typescript
// ✅ Timeout for promises
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  
  return Promise.race([promise, timeout])
}

// Usage
const user = await withTimeout(
  fetchUser(id),
  5000,
  "User fetch timed out"
)
```

---

## 8. Error Recovery

### Circuit Breaker

```typescript
// ✅ Circuit breaker pattern
class CircuitBreaker {
  private failures = 0
  private state: "closed" | "open" | "half-open" = "closed"
  private lastFailureTime = 0
  
  constructor(
    private threshold = 5,
    private resetTimeout = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open"
      } else {
        throw new Error("Circuit breaker is open")
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failures = 0
    this.state = "closed"
  }
  
  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = "open"
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000)

async function fetchWithBreaker(url: string) {
  return breaker.execute(() => fetch(url).then((r) => r.json()))
}
```

### Fallback Chain

```typescript
// ✅ Try multiple fallbacks
async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallbacks: (() => Promise<T>)[]
): Promise<T> {
  try {
    return await primary()
  } catch (primaryError) {
    console.warn("Primary failed, trying fallbacks...")
    
    for (const fallback of fallbacks) {
      try {
        return await fallback()
      } catch (fallbackError) {
        console.warn("Fallback failed:", fallbackError)
      }
    }
    
    throw primaryError
  }
}

// Usage
const data = await fetchWithFallback(
  () => fetchFromPrimary(),
  [
    () => fetchFromCache(),
    () => fetchFromBackup(),
  ]
)
```

---

## 9. Best Practices

1. **Use custom error types** — Create specific error classes
2. **Handle errors at appropriate level** — Don't catch everywhere
3. **Log errors with context** — Include relevant metadata
4. **Provide fallback UI** — Graceful degradation
5. **Use try/catch for async** — Always handle promise rejections
6. **Implement retry logic** — For transient failures
7. **Use circuit breakers** — Prevent cascading failures
8. **Test error paths** — Not just happy paths
9. **Document error codes** — Maintain error catalog
10. **Monitor in production** — Track error rates and types
