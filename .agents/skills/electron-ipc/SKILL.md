---
name: electron-ipc
description: Electron IPC patterns, type-safe communication between main and renderer, preload scripts, and withLogging wrappers for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Electron IPC Patterns

Electron IPC patterns for type-safe communication between main and renderer processes in the Devil AI codebase.

## When to Apply

- Creating IPC handlers
- Sending messages between processes
- Type-safe IPC communication
- Error handling in IPC
- Preload script setup

---

## 1. IPC Architecture

### Process Communication Flow

```
Renderer Process (React)
    ↓ invoke/handle
Preload Script (Bridge)
    ↓ ipcRenderer/ipcMain
Main Process (Node.js)
```

### File Structure

```
apps/desktop/src/
├── main/
│   ├── ipc/
│   │   ├── index.ts          # IPC handler registration
│   │   ├── handlers.ts       # Handler implementations
│   │   └── with-logging.ts   # Error logging wrapper
│   └── index.ts              # Main process entry
├── preload/
│   ├── index.ts              # Preload script
│   └── types.ts              # IPC type definitions
└── renderer/
    └── services/
        └── backend.ts        # Backend service layer
```

---

## 2. Type Definitions

### IPC Channels

```typescript
// ✅ preload/types.ts
export interface IPCChannels {
  // User operations
  "user:get": {
    params: { id: string }
    result: User | null
  }
  "user:update": {
    params: { id: string; data: Partial<User> }
    result: User
  }
  
  // Session operations
  "session:list": {
    params: { page?: number; limit?: number }
    result: { data: Session[]; total: number }
  }
  "session:create": {
    params: { title?: string; model?: string }
    result: Session
  }
  
  // File operations
  "file:read": {
    params: { path: string }
    result: string
  }
  "file:write": {
    params: { path: string; content: string }
    result: void
  }
  
  // App operations
  "app:quit": {
    params: never
    result: void
  }
  "app:minimize": {
    params: never
    result: void
  }
}
```

### IPC API Type

```typescript
// ✅ preload/types.ts
export interface IPCAPI {
  invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ): Promise<IPCChannels[K]["result"]>
  
  on<K extends keyof IPCEvents>(
    channel: K,
    handler: (data: IPCEvents[K]) => void
  ): () => void
  
  send<K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ): void
}
```

---

## 3. Main Process Handlers

### Handler Registration

```typescript
// ✅ main/ipc/index.ts
import { ipcMain } from "electron"
import { withLogging } from "./with-logging"
import { handlers } from "./handlers"

export function registerIPCHandlers(): void {
  // Register all handlers
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(
      channel,
      withLogging(channel, handler as (...args: unknown[]) => Promise<unknown>)
    )
  }
  
  console.log(`[IPC] Registered ${Object.keys(handlers).length} handlers`)
}
```

### Handler Implementations

```typescript
// ✅ main/ipc/handlers.ts
import { getDb } from "../db"
import { UserRepository } from "../repositories/user"

export const handlers: Record<string, (...args: unknown[]) => Promise<unknown>> = {
  // User handlers
  "user:get": async (params: { id: string }) => {
    return UserRepository.findById(params.id)
  },
  
  "user:update": async (params: { id: string; data: Partial<User> }) => {
    return UserRepository.update(params.id, params.data)
  },
  
  // Session handlers
  "session:list": async (params: { page?: number; limit?: number }) => {
    return UserRepository.findAll(params)
  },
  
  "session:create": async (params: { title?: string; model?: string }) => {
    return SessionRepository.create(params)
  },
  
  // File handlers
  "file:read": async (params: { path: string }) => {
    const file = Bun.file(params.path)
    return file.text()
  },
  
  "file:write": async (params: { path: string; content: string }) => {
    await Bun.write(params.path, params.content)
  },
  
  // App handlers
  "app:quit": async () => {
    const { app } = require("electron")
    app.quit()
  },
  
  "app:minimize": async () => {
    const { BrowserWindow } = require("electron")
    BrowserWindow.getFocusedWindow()?.minimize()
  },
}
```

### With Logging Wrapper

```typescript
// ✅ main/ipc/with-logging.ts
import { IPCInvokeEvent } from "electron"

export function withLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  channel: string,
  handler: T
): T {
  return (async (event: IPCInvokeEvent, ...args: unknown[]) => {
    const start = Date.now()
    const sender = event.senderFrame?.url ?? "unknown"
    
    console.log(`[IPC] ${channel} <- ${sender}`, args)
    
    try {
      const result = await handler(...args)
      const duration = Date.now() - start
      
      console.log(`[IPC] ${channel} -> OK (${duration}ms)`)
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      console.error(`[IPC] ${channel} -> ERROR (${duration}ms)`, error)
      
      // Re-throw with additional context
      if (error instanceof Error) {
        throw new Error(`IPC ${channel}: ${error.message}`)
      }
      
      throw error
    }
  }) as T
}
```

---

## 4. Preload Script

### Context Bridge

```typescript
// ✅ preload/index.ts
import { contextBridge, ipcRenderer } from "electron"
import type { IPCChannels, IPCEvents } from "./types"

const ipcAPI = {
  invoke: <K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ) => ipcRenderer.invoke(channel, ...args),
  
  on: <K extends keyof IPCEvents>(
    channel: K,
    handler: (data: IPCEvents[K]) => void
  ) => {
    const wrappedHandler = (_event: Electron.IpcRendererEvent, data: IPCEvents[K]) => {
      handler(data)
    }
    
    ipcRenderer.on(channel, wrappedHandler)
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, wrappedHandler)
    }
  },
  
  send: <K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ) => {
    ipcRenderer.send(channel, ...args)
  },
}

// Expose to renderer
contextBridge.exposeInMainWorld("devilAi", ipcAPI)

// Type declaration
declare global {
  interface Window {
    devilAi: typeof ipcAPI
  }
}
```

### Type-Safe Window Object

```typescript
// ✅ renderer/types/electron.ts
import type { IPCChannels, IPCEvents } from "../../preload/types"

export interface DevilAiAPI {
  invoke: <K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ) => Promise<IPCChannels[K]["result"]>
  
  on: <K extends keyof IPCEvents>(
    channel: K,
    handler: (data: IPCEvents[K]) => void
  ) => () => void
  
  send: <K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ) => void
}

declare global {
  interface Window {
    devilAi?: DevilAiAPI
  }
}
```

---

## 5. Renderer Service Layer

### Backend Service

```typescript
// ✅ renderer/services/backend.ts
import type { DevilAiAPI } from "../types/electron"

class BackendService {
  private api: DevilAiAPI | null = null
  
  constructor() {
    // Check if running in Electron
    if (typeof window !== "undefined" && window.devilAi) {
      this.api = window.devilAi
    }
  }
  
  get isElectron(): boolean {
    return this.api !== null
  }
  
  async invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]["params"] extends never 
      ? [] 
      : [IPCChannels[K]["params"]]
  ): Promise<IPCChannels[K]["result"]> {
    if (this.api) {
      return this.api.invoke(channel, ...args)
    }
    
    // Fallback to HTTP in browser mode
    return this.httpInvoke(channel, args[0])
  }
  
  private async httpInvoke(channel: string, params: unknown): Promise<unknown> {
    const response = await fetch(`/api/${channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    return response.json()
  }
  
  on<K extends keyof IPCEvents>(
    channel: K,
    handler: (data: IPCEvents[K]) => void
  ): () => void {
    if (this.api) {
      return this.api.on(channel, handler)
    }
    
    // Fallback to EventSource in browser mode
    const eventSource = new EventSource(`/api/events/${channel}`)
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handler(data)
      } catch (error) {
        console.error(`Failed to parse SSE data for ${channel}:`, error)
      }
    }
    
    return () => {
      eventSource.close()
    }
  }
}

export const backend = new BackendService()
```

### Usage in React

```typescript
// ✅ renderer/hooks/use-backend.ts
import { backend } from "../services/backend"

export function useBackend() {
  return {
    isElectron: backend.isElectron,
    
    invoke: backend.invoke.bind(backend),
    on: backend.on.bind(backend),
  }
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const { invoke, on } = useBackend()
  
  useEffect(() => {
    invoke("user:get", { id: userId }).then(setUser)
    
    const unsubscribe = on("user:updated", (data) => {
      if (data.id === userId) {
        setUser(data)
      }
    })
    
    return unsubscribe
  }, [userId, invoke, on])
  
  return <div>{user?.name}</div>
}
```

---

## 6. Event Patterns

### Main to Renderer Events

```typescript
// ✅ main/events.ts
import { BrowserWindow } from "electron"

export function sendToRenderer(channel: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data)
  })
}

// Usage
sendToRenderer("user:updated", { id: "123", name: "Updated Name" })
sendToRenderer("progress:update", { stage: "processing", progress: 50 })
```

### Renderer to Main Events

```typescript
// ✅ renderer/services/events.ts
export function notifyMain(channel: string, data: unknown): void {
  window.devilAi?.send(channel as never, data as never)
}

// Usage
notifyMain("user:login", { userId: "123" })
```

### Bidirectional Events

```typescript
// ✅ Event channel definition
interface IPCEvents {
  "user:updated": User
  "progress:update": Progress
  "notification:new": Notification
  "session:created": Session
}

// Main process
import { sendToRenderer } from "./events"

// Send event
sendToRenderer("user:updated", updatedUser)

// Renderer process
const unsubscribe = backend.on("user:updated", (user) => {
  console.log("User updated:", user)
})

// Cleanup
unsubscribe()
```

---

## 7. Error Handling

### IPC Error Types

```typescript
// ✅ errors/ipc-errors.ts
export class IPCError extends Error {
  constructor(
    public channel: string,
    message: string,
    public originalError?: Error
  ) {
    super(`IPC ${channel}: ${message}`)
    this.name = "IPCError"
  }
}

export class IPCTimeoutError extends IPCError {
  constructor(channel: string, timeout: number) {
    super(channel, `Timeout after ${timeout}ms`)
    this.name = "IPCTimeoutError"
  }
}
```

### Error Handling in Handlers

```typescript
// ✅ main/ipc/handlers.ts
export const handlers = {
  "user:get": async (params: { id: string }) => {
    try {
      const user = await UserRepository.findById(params.id)
      
      if (!user) {
        throw new Error("User not found")
      }
      
      return user
    } catch (error) {
      // Log and re-throw
      console.error("[IPC] user:get failed:", error)
      throw error
    }
  },
}
```

### Error Handling in Renderer

```typescript
// ✅ renderer/hooks/use-invoke.ts
import { useState, useCallback } from "react"
import { backend } from "../services/backend"

export function useInvoke<K extends keyof IPCChannels>(channel: K) {
  const [data, setData] = useState<IPCChannels[K]["result"] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const invoke = useCallback(
    async (params: IPCChannels[K]["params"]) => {
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await backend.invoke(channel, params)
        setData(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [channel]
  )
  
  return { data, error, isLoading, invoke }
}
```

---

## 8. Security Best Practices

### Channel Validation

```typescript
// ✅ main/ipc/validate.ts
const ALLOWED_CHANNELS = new Set([
  "user:get",
  "user:update",
  "session:list",
  "session:create",
  "file:read",
  "file:write",
])

export function validateChannel(channel: string): boolean {
  return ALLOWED_CHANNELS.has(channel)
}

// Usage in handler registration
ipcMain.handle("ipc:invoke", withLogging("ipc:invoke", async (event, channel, ...args) => {
  if (!validateChannel(channel)) {
    throw new Error(`Invalid IPC channel: ${channel}`)
  }
  
  const handler = handlers[channel]
  if (!handler) {
    throw new Error(`No handler for channel: ${channel}`)
  }
  
  return handler(...args)
}))
```

### Sender Validation

```typescript
// ✅ Validate sender origin
export function validateSender(event: Electron.IpcMainInvokeEvent): boolean {
  const senderUrl = event.senderFrame?.url
  
  if (!senderUrl) {
    return false
  }
  
  // Only allow from your app's origin
  return senderUrl.startsWith("file://") || 
         senderUrl.startsWith("http://localhost")
}
```

### Rate Limiting

```typescript
// ✅ Rate limit IPC calls
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimitIPC(channel: string, maxCalls = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(channel)
  
  if (record && record.resetAt > now) {
    if (record.count >= maxCalls) {
      return false // Rate limited
    }
    record.count++
  } else {
    rateLimitMap.set(channel, { count: 1, resetAt: now + windowMs })
  }
  
  return true
}
```

---

## 9. Testing

### Mock IPC

```typescript
// ✅ test/helpers/ipc-mock.ts
import { mock } from "bun:test"

export function createMockIPC() {
  const handlers = new Map<string, mock.Mock<(...args: unknown[]) => unknown>>()
  
  return {
    invoke: mock(async (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel)
      if (!handler) {
        throw new Error(`No handler for channel: ${channel}`)
      }
      return handler(...args)
    }),
    
    on: mock((channel: string, handler: (...args: unknown[]) => void) => {
      // Store handler for testing
      return () => {} // Cleanup function
    }),
    
    registerHandler: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, mock(handler))
    },
    
    getHandler: (channel: string) => handlers.get(channel),
  }
}
```

---

## Best Practices

1. **Type everything** — Define IPC channel types for type safety
2. **Use withLogging** — Always wrap handlers with logging
3. **Validate channels** — Only allow whitelisted channels
4. **Handle errors** — Both in handlers and renderer
5. **Clean up listeners** — Remove event listeners on unmount
6. **Rate limit** — Prevent abuse of IPC calls
7. **Test IPC** — Mock handlers for unit tests
8. **Document channels** — Maintain a list of all IPC channels
9. **Use preload bridge** — Never expose ipcRenderer directly
10. **Security first** — Validate sender, sanitize inputs
