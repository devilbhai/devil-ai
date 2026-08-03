---
name: sse-streaming
description: Server-Sent Events patterns, reconnection, streaming responses, and real-time data for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# SSE Streaming Patterns

Server-Sent Events (SSE) patterns for real-time data in the Devil AI codebase.

## When to Apply

- Implementing real-time updates
- Streaming AI responses
- Live notifications
- Progress updates
- Event-driven features

---

## 1. Server Implementation

### Basic SSE Endpoint

```typescript
// ✅ routes/sse.ts
import { Hono } from "hono"

const sseRoutes = new Hono()

sseRoutes.get("/events", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode("event: connected\ndata: {}\n\n")
      )
      
      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)
      
      // Cleanup on connection close
      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
})

export { sseRoutes }
```

### Typed SSE Events

```typescript
// ✅ types/sse.ts
export interface SSEEvent {
  event: string
  data: unknown
  id?: string
  retry?: number
}

export interface SSEMessage {
  type: "message" | "error" | "status"
  content: string
  timestamp: number
}

export interface SSEProgress {
  stage: string
  progress: number // 0-100
  message?: string
}
```

### Event Emitter Pattern

```typescript
// ✅ services/event-emitter.ts
type EventHandler = (data: unknown) => void

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<string, Set<EventHandler>>()
  
  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    if (!this.handlers.has(event as string)) {
      this.handlers.set(event as string, new Set())
    }
    this.handlers.get(event as string)!.add(handler as EventHandler)
    
    return () => {
      this.handlers.get(event as string)?.delete(handler as EventHandler)
    }
  }
  
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.handlers.get(event as string)?.forEach((handler) => handler(data))
  }
  
  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void {
    this.handlers.get(event as string)?.delete(handler as EventHandler)
  }
}

// Usage
interface AppEvents {
  "user:login": { userId: string }
  "message:new": { content: string; author: string }
  "progress:update": { stage: string; progress: number }
}

export const eventEmitter = new TypedEventEmitter<AppEvents>()
```

### Streaming with SSE

```typescript
// ✅ Stream AI response
sseRoutes.get("/chat/:sessionId/stream", async (c) => {
  const sessionId = c.req.param("sessionId")
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }
      
      // Subscribe to message events
      const unsubscribe = eventEmitter.on("message:new", (data) => {
        sendEvent("message", data)
      })
      
      // Subscribe to progress events
      const unsubscribeProgress = eventEmitter.on("progress:update", (data) => {
        sendEvent("progress", data)
      })
      
      // Cleanup on disconnect
      c.req.raw.signal.addEventListener("abort", () => {
        unsubscribe()
        unsubscribeProgress()
        controller.close()
      })
    },
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
})
```

---

## 2. Client Implementation

### Basic SSE Client

```typescript
// ✅ services/sse-client.ts
interface SSEClientOptions {
  url: string
  onMessage?: (event: MessageEvent) => void
  onError?: (error: Event) => void
  onOpen?: (event: Event) => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private options: SSEClientOptions
  private reconnectAttempts = 0
  private isConnecting = false
  
  constructor(options: SSEClientOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      ...options,
    }
  }
  
  connect(): void {
    if (this.isConnecting || this.eventSource) {
      return
    }
    
    this.isConnecting = true
    
    this.eventSource = new EventSource(this.options.url)
    
    this.eventSource.onopen = (event) => {
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.options.onOpen?.(event)
    }
    
    this.eventSource.onmessage = (event) => {
      this.options.onMessage?.(event)
    }
    
    this.eventSource.onerror = (event) => {
      this.isConnecting = false
      this.options.onError?.(event)
      
      if (this.options.reconnect) {
        this.handleReconnect()
      } else {
        this.options.onDisconnect?.()
      }
    }
  }
  
  private handleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 10)) {
      this.options.onDisconnect?.()
      return
    }
    
    this.reconnectAttempts++
    
    // Exponential backoff
    const delay = this.options.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }
  
  disconnect(): void {
    this.eventSource?.close()
    this.eventSource = null
    this.isConnecting = false
  }
  
  addEventListener(event: string, handler: (event: MessageEvent) => void): void {
    this.eventSource?.addEventListener(event, handler)
  }
  
  removeEventListener(event: string, handler: (event: MessageEvent) => void): void {
    this.eventSource?.removeEventListener(event, handler)
  }
}
```

### React Hook for SSE

```typescript
// ✅ hooks/use-sse.ts
import { useEffect, useRef, useState, useCallback } from "react"

interface UseSSEOptions {
  url: string
  enabled?: boolean
  onMessage?: (data: unknown) => void
  onError?: (error: Event) => void
}

interface UseSSEReturn {
  isConnected: boolean
  error: Event | null
  lastMessage: unknown | null
  connect: () => void
  disconnect: () => void
}

export function useSSE({
  url,
  enabled = true,
  onMessage,
  onError,
}: UseSSEOptions): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)
  const [lastMessage, setLastMessage] = useState<unknown | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return
    }
    
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)
      } catch {
        setLastMessage(event.data)
        onMessage?.(event.data)
      }
    }
    
    eventSource.onerror = (event) => {
      setIsConnected(false)
      setError(event)
      onError?.(event)
      eventSourceRef.current = null
    }
  }, [url, onMessage, onError])
  
  const disconnect = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setIsConnected(false)
  }, [])
  
  useEffect(() => {
    if (enabled) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])
  
  return {
    isConnected,
    error,
    lastMessage,
    connect,
    disconnect,
  }
}
```

### Typed SSE Hook

```typescript
// ✅ hooks/use-typed-sse.ts
import { useSSE } from "./use-sse"

interface SSEMessageType {
  message: { content: string; author: string; timestamp: number }
  progress: { stage: string; progress: number; message?: string }
  error: { message: string; code: string }
  status: { online: boolean }
}

export function useTypedSSE<T extends keyof SSEMessageType>(
  url: string,
  eventType: T,
  onMessage: (data: SSEMessageType[T]) => void
) {
  return useSSE({
    url,
    onMessage: (data) => {
      if (typeof data === "object" && data !== null && "type" in data) {
        const event = data as { type: T; payload: SSEMessageType[T] }
        if (event.type === eventType) {
          onMessage(event.payload)
        }
      }
    },
  })
}
```

---

## 3. Reconnection Patterns

### Exponential Backoff

```typescript
// ✅ Exponential backoff with jitter
function calculateBackoff(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000,
  jitter = true
): number {
  let delay = baseDelay * Math.pow(2, attempt)
  delay = Math.min(delay, maxDelay)
  
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5)
  }
  
  return delay
}

// Usage
async function connectWithBackoff(url: string, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const eventSource = new EventSource(url)
      
      return new Promise<void>((resolve, reject) => {
        eventSource.onopen = () => {
          console.log("Connected")
          resolve()
        }
        
        eventSource.onerror = (error) => {
          reject(error)
        }
      })
    } catch (error) {
      const delay = calculateBackoff(attempt)
      console.log(`Reconnecting in ${delay}ms (attempt ${attempt + 1})`)
      await Bun.sleep(delay)
    }
  }
  
  throw new Error("Max reconnection attempts reached")
}
```

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
  return breaker.execute(() => fetch(url))
}
```

---

## 4. Data Serialization

### JSON Events

```typescript
// ✅ Serialize events
function serializeEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// ✅ Parse events
function parseEvent(raw: string): { event: string; data: unknown } | null {
  const lines = raw.split("\n")
  let event = "message"
  let data = ""
  
  for (const line of lines) {
    if (line.startsWith("event: ")) {
      event = line.slice(7)
    } else if (line.startsWith("data: ")) {
      data += line.slice(6)
    }
  }
  
  if (!data) return null
  
  try {
    return { event, data: JSON.parse(data) }
  } catch {
    return { event, data }
  }
}
```

### Binary Data

```typescript
// ✅ Send binary data as base64
function sendBinaryData(controller: ReadableStreamDefaultController, data: Buffer) {
  const encoder = new TextEncoder()
  const base64 = data.toString("base64")
  
  controller.enqueue(
    encoder.encode(`event: binary\ndata: ${base64}\n\n`)
  )
}

// ✅ Receive binary data
function receiveBinaryData(event: MessageEvent): Buffer {
  return Buffer.from(event.data, "base64")
}
```

---

## 5. Progress Tracking

### Progress Events

```typescript
// ✅ Progress tracking
interface ProgressEvent {
  stage: string
  progress: number // 0-100
  message?: string
  estimatedTimeRemaining?: number
}

function sendProgress(
  controller: ReadableStreamDefaultController,
  progress: ProgressEvent
) {
  const encoder = new TextEncoder()
  controller.enqueue(
    encoder.encode(`event: progress\ndata: ${JSON.stringify(progress)}\n\n`)
  )
}

// Usage in stream
start(controller) {
  sendProgress(controller, { stage: "initializing", progress: 0 })
  
  // ... processing ...
  
  sendProgress(controller, { stage: "processing", progress: 50, message: "Halfway done" })
  
  // ... more processing ...
  
  sendProgress(controller, { stage: "complete", progress: 100 })
}
```

### React Progress Hook

```typescript
// ✅ hooks/use-progress.ts
import { useState, useEffect } from "react"

interface Progress {
  stage: string
  progress: number
  message?: string
}

export function useProgress(sseUrl: string) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const eventSource = new EventSource(sseUrl)
    
    eventSource.addEventListener("progress", (event) => {
      try {
        const data = JSON.parse(event.data) as Progress
        setProgress(data)
      } catch {
        setError("Failed to parse progress data")
      }
    })
    
    eventSource.addEventListener("error", (event) => {
      setError("Connection error")
    })
    
    return () => {
      eventSource.close()
    }
  }, [sseUrl])
  
  return { progress, error }
}
```

---

## 6. Multi-Tab Support

### Broadcast Channel

```typescript
// ✅ Share SSE data across tabs
class SSEBroadcast {
  private channel: BroadcastChannel
  private eventSource: EventSource | null = null
  
  constructor(channelName: string, private url: string) {
    this.channel = new BroadcastChannel(channelName)
  }
  
  connect(): void {
    this.eventSource = new EventSource(this.url)
    
    this.eventSource.onmessage = (event) => {
      // Broadcast to other tabs
      this.channel.postMessage(event.data)
    }
  }
  
  onMessage(handler: (data: string) => void): () => void {
    this.channel.onmessage = (event) => {
      handler(event.data as string)
    }
    
    return () => {
      this.channel.onmessage = null
    }
  }
  
  disconnect(): void {
    this.eventSource?.close()
    this.channel.close()
  }
}

// Usage
const sse = new SSEBroadcast("app-events", "/api/events")
sse.connect()

sse.onMessage((data) => {
  console.log("Received from SSE:", data)
})
```

---

## 7. Error Handling

### Error Events

```typescript
// ✅ Error event structure
interface ErrorEvent {
  type: "error"
  message: string
  code?: string
  retryable: boolean
}

// ✅ Send error event
function sendError(
  controller: ReadableStreamDefaultController,
  message: string,
  code?: string,
  retryable = true
) {
  const encoder = new TextEncoder()
  const errorData: ErrorEvent = {
    type: "error",
    message,
    code,
    retryable,
  }
  
  controller.enqueue(
    encoder.encode(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`)
  )
}
```

### Client Error Handling

```typescript
// ✅ Handle errors in React
function useSSEWithErrorHandling(url: string) {
  const [error, setError] = useState<ErrorEvent | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleError = useCallback((event: ErrorEvent) => {
    setError(event)
    
    if (event.retryable) {
      setIsRetrying(true)
      // Auto-retry logic
    }
  }, [])
  
  return { error, isRetrying, handleError }
}
```

---

## 8. Testing

### Mock SSE Server

```typescript
// ✅ test/helpers/sse-mock.ts
import { Hono } from "hono"

export function createMockSSEServer() {
  const app = new Hono()
  const clients = new Set<ReadableStreamDefaultController>()
  
  app.get("/events", (c) => {
    const stream = new ReadableStream({
      start(controller) {
        clients.add(controller)
        
        c.req.raw.signal.addEventListener("abort", () => {
          clients.delete(controller)
          controller.close()
        })
      },
    })
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    })
  })
  
  return {
    app,
    broadcast(event: string, data: unknown) {
      const encoder = new TextEncoder()
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      
      for (const client of clients) {
        try {
          client.enqueue(encoder.encode(message))
        } catch {
          clients.delete(client)
        }
      }
    },
    getClientCount() {
      return clients.size
    },
  }
}
```

### Test SSE Client

```typescript
// ✅ test/sse.test.ts
import { describe, it, expect } from "bun:test"
import { createMockSSEServer } from "./helpers/sse-mock"

describe("SSE", () => {
  it("receives events", async () => {
    const server = createMockSSEServer()
    // ... test implementation
  })
})
```

---

## Best Practices

1. **Always send heartbeat** — Keep connection alive with periodic pings
2. **Handle reconnection** — Implement exponential backoff
3. **Clean up listeners** — Remove event listeners on disconnect
4. **Use typed events** — Define event types for type safety
5. **Serialize efficiently** — Minimize payload size
6. **Handle errors gracefully** — Send error events, don't just disconnect
7. **Test SSE endpoints** — Mock servers for unit tests
8. **Consider HTTP/2** — Better multiplexing for multiple SSE streams
9. **Disable buffering** — Use `X-Accel-Buffering: no` for nginx
10. **Document events** — List all event types and their payloads
