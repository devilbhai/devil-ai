---
name: opencode-sdk
description: OpenCode SDK v2 usage patterns, session management, event streaming, and permissions for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# OpenCode SDK Patterns

OpenCode SDK v2 patterns for the Devil AI codebase.

## When to Apply

- Integrating with OpenCode API
- Managing sessions
- Streaming events
- Handling permissions
- Using SDK types

---

## 1. SDK Setup

### Installation

```bash
bun add @opencode-ai/sdk
```

### Client Initialization

```typescript
// ✅ services/opencode.ts
import { Client } from "@opencode-ai/sdk/v2/client"

let client: Client | null = null

export function getClient(): Client {
  if (!client) {
    client = new Client({
      baseUrl: process.env.OPENCODE_API_URL || "http://localhost:3000",
      headers: {
        Authorization: `Bearer ${process.env.OPENCODE_API_KEY}`,
      },
    })
  }
  return client
}

export function setClient(newClient: Client): void {
  client = newClient
}
```

### Type Imports

```typescript
// ✅ Always import from v2
import type {
  Session,
  Event,
  Permission,
  PermissionRuleset,
  PermissionRule,
  Message,
  Part,
} from "@opencode-ai/sdk/v2/client"
```

---

## 2. Session Management

### Create Session

```typescript
// ✅ Create a new session
import { getClient } from "../opencode"

export async function createSession(options?: {
  title?: string
  model?: string
  permission?: PermissionRuleset
}): Promise<Session> {
  const client = getClient()
  
  const session = await client.session.create({
    body: {
      title: options?.title,
      model: options?.model,
      permission: options?.permission,
    },
  })
  
  return session
}
```

### List Sessions

```typescript
// ✅ List all sessions
export async function listSessions(options?: {
  page?: number
  limit?: number
}): Promise<Session[]> {
  const client = getClient()
  
  const sessions = await client.session.list({
    query: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    },
  })
  
  return sessions
}
```

### Get Session

```typescript
// ✅ Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const client = getClient()
  
  try {
    const session = await client.session.get({
      path: { id: sessionId },
    })
    return session
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null
    }
    throw error
  }
}
```

### Delete Session

```typescript
// ✅ Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  const client = getClient()
  
  await client.session.delete({
    path: { id: sessionId },
  })
}
```

---

## 3. Message Operations

### Send Message

```typescript
// ✅ Send a message to session
export async function sendMessage(
  sessionId: string,
  content: string,
  options?: {
    model?: string
    permission?: PermissionRuleset
  }
): Promise<Message> {
  const client = getClient()
  
  const message = await client.session.message.create({
    path: { id: sessionId },
    body: {
      content,
      model: options?.model,
      permission: options?.permission,
    },
  })
  
  return message
}
```

### List Messages

```typescript
// ✅ List messages in session
export async function listMessages(
  sessionId: string,
  options?: {
    page?: number
    limit?: number
  }
): Promise<Message[]> {
  const client = getClient()
  
  const messages = await client.session.message.list({
    path: { id: sessionId },
    query: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 50,
    },
  })
  
  return messages
}
```

### Get Message

```typescript
// ✅ Get message by ID
export async function getMessage(
  sessionId: string,
  messageId: string
): Promise<Message | null> {
  const client = getClient()
  
  try {
    const message = await client.session.message.get({
      path: {
        id: sessionId,
        messageId,
      },
    })
    return message
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null
    }
    throw error
  }
}
```

---

## 4. Event Streaming

### Global Event Stream

```typescript
// ✅ Stream all events from all projects
import { getClient } from "../opencode"

export function streamGlobalEvents(handlers: {
  onMessage?: (event: Event) => void
  onError?: (error: Error) => void
  onOpen?: () => void
}): () => void {
  const client = getClient()
  
  const eventSource = client.global.event()
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as Event
      handlers.onMessage?.(data)
    } catch (error) {
      handlers.onError?.(error instanceof Error ? error : new Error("Parse error"))
    }
  }
  
  eventSource.onerror = (error) => {
    handlers.onError?.(error instanceof Error ? error : new Error("EventSource error"))
  }
  
  eventSource.onopen = () => {
    handlers.onOpen?.()
  }
  
  return () => {
    eventSource.close()
  }
}
```

### Session Event Stream

```typescript
// ✅ Stream events for specific session
export function streamSessionEvents(
  sessionId: string,
  handlers: {
    onMessage?: (event: Event) => void
    onError?: (error: Error) => void
  }
): () => void {
  const client = getClient()
  
  const eventSource = client.session.event({ path: { id: sessionId } })
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as Event
      handlers.onMessage?.(data)
    } catch (error) {
      handlers.onError?.(error instanceof Error ? error : new Error("Parse error"))
    }
  }
  
  eventSource.onerror = (error) => {
    handlers.onError?.(error instanceof Error ? error : new Error("EventSource error"))
  }
  
  return () => {
    eventSource.close()
  }
}
```

### Event Types

```typescript
// ✅ Event type handling
import type { Event } from "@opencode-ai/sdk/v2/client"

function handleEvent(event: Event) {
  switch (event.type) {
    case "session.created":
      console.log("Session created:", event.data)
      break
    
    case "session.updated":
      console.log("Session updated:", event.data)
      break
    
    case "message.created":
      console.log("Message created:", event.data)
      break
    
    case "message.updated":
      console.log("Message updated:", event.data)
      break
    
    case "permission.requested":
      handlePermissionRequest(event.data)
      break
    
    case "error":
      console.error("Error event:", event.data)
      break
    
    default:
      console.log("Unknown event:", event)
  }
}
```

---

## 5. Permission Handling

### Permission Ruleset

```typescript
// ✅ Define permission rules
import type { PermissionRuleset } from "@opencode-ai/sdk/v2/client"

const defaultPermissions: PermissionRuleset = {
  // Allow all file reads
  "file.read": "allow",
  
  // Ask for file writes
  "file.write": "ask",
  
  // Allow command execution with user confirmation
  "command.execute": "ask",
  
  // Deny network access
  "network.access": "deny",
}

// Usage
const session = await createSession({
  permission: defaultPermissions,
})
```

### Permission Response

```typescript
// ✅ Handle permission requests
import type { Permission } from "@opencode-ai/sdk/v2/client"

async function handlePermissionRequest(permission: Permission) {
  // Show permission dialog to user
  const approved = await showPermissionDialog({
    type: permission.type,
    description: permission.description,
    resource: permission.resource,
  })
  
  if (approved) {
    await permission.reply({ approved: true })
  } else {
    await permission.reply({
      approved: false,
      reason: "User denied permission",
    })
  }
}
```

### Permission List

```typescript
// ✅ List pending permissions
async function listPendingPermissions(sessionId: string): Promise<Permission[]> {
  const client = getClient()
  
  const permissions = await client.session.permission.list({
    path: { id: sessionId },
  })
  
  return permissions
}
```

---

## 6. Model Management

### List Models

```typescript
// ✅ List available models
import { getClient } from "../opencode"

export async function listModels() {
  const client = getClient()
  
  const models = await client.model.list()
  
  return models
}
```

### Set Active Model

```typescript
// ✅ Set model for session
export async function setSessionModel(
  sessionId: string,
  modelId: string
): Promise<void> {
  const client = getClient()
  
  await client.session.update({
    path: { id: sessionId },
    body: {
      model: modelId,
    },
  })
}
```

---

## 7. Configuration

### Get Configuration

```typescript
// ✅ Get OpenCode configuration
export async function getConfig() {
  const client = getClient()
  
  const config = await client.config.get()
  
  return config
}
```

### Update Configuration

```typescript
// ✅ Update configuration
export async function updateConfig(updates: Record<string, unknown>) {
  const client = getClient()
  
  await client.config.update({
    body: updates,
  })
}
```

---

## 8. Error Handling

### SDK Error Types

```typescript
// ✅ Handle SDK errors
import { Client } from "@opencode-ai/sdk/v2/client"

export async function safeSDKCall<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("401")) {
        console.error("Unauthorized - check API key")
      } else if (error.message.includes("404")) {
        console.error("Resource not found")
      } else if (error.message.includes("429")) {
        console.error("Rate limited - retry later")
      } else if (error.message.includes("500")) {
        console.error("Server error")
      }
    }
    
    console.error("SDK call failed:", error)
    return null
  }
}
```

### Retry Logic

```typescript
// ✅ Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry ${attempt + 1} in ${delay}ms`)
      await Bun.sleep(delay)
    }
  }
  
  throw new Error("Max retries exceeded")
}
```

---

## 9. React Integration

### SDK Context

```typescript
// ✅ contexts/opencode-context.tsx
import { createContext, useContext, useEffect, useState } from "react"
import { Client } from "@opencode-ai/sdk/v2/client"
import type { Session } from "@opencode-ai/sdk/v2/client"

interface OpenCodeContextType {
  client: Client | null
  isConnected: boolean
  sessions: Session[]
  currentSession: Session | null
  setCurrentSession: (session: Session | null) => void
}

const OpenCodeContext = createContext<OpenCodeContextType | null>(null)

export function OpenCodeProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  
  useEffect(() => {
    const newClient = new Client({
      baseUrl: process.env.OPENCODE_API_URL || "http://localhost:3000",
    })
    
    setClient(newClient)
    setIsConnected(true)
    
    // Load sessions
    newClient.session.list().then(setSessions)
  }, [])
  
  return (
    <OpenCodeContext.Provider
      value={{
        client,
        isConnected,
        sessions,
        currentSession,
        setCurrentSession,
      }}
    >
      {children}
    </OpenCodeContext.Provider>
  )
}

export function useOpenCode() {
  const context = useContext(OpenCodeContext)
  if (!context) {
    throw new Error("useOpenCode must be used within OpenCodeProvider")
  }
  return context
}
```

### Session Hook

```typescript
// ✅ hooks/use-session.ts
import { useState, useEffect } from "react"
import { useOpenCode } from "../contexts/opencode-context"
import type { Session, Message } from "@opencode-ai/sdk/v2/client"

export function useSession(sessionId: string | null) {
  const { client } = useOpenCode()
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!sessionId || !client) return
    
    setIsLoading(true)
    
    client.session
      .get({ path: { id: sessionId } })
      .then((session) => {
        setSession(session)
        return client.session.message.list({
          path: { id: sessionId },
        })
      })
      .then((messages) => {
        setMessages(messages)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to load session"))
        setIsLoading(false)
      })
  }, [sessionId, client])
  
  const sendMessage = async (content: string) => {
    if (!client || !sessionId) return
    
    const message = await client.session.message.create({
      path: { id: sessionId },
      body: { content },
    })
    
    setMessages((prev) => [...prev, message])
    
    return message
  }
  
  return {
    session,
    messages,
    isLoading,
    error,
    sendMessage,
  }
}
```

---

## 10. Best Practices

1. **Always use v2 types** — Import from `@opencode-ai/sdk/v2/client`
2. **Type everything** — Use SDK types, don't redefine locally
3. **Handle errors gracefully** — Wrap SDK calls in try/catch
4. **Use permission rulesets** — Define clear permission policies
5. **Stream events** — Use SSE for real-time updates
6. **Cache sessions** — Don't fetch sessions repeatedly
7. **Handle reconnection** — Implement backoff for event streams
8. **Validate responses** — Check for null/undefined before using
9. **Clean up listeners** — Remove event listeners on unmount
10. **Document integrations** — Keep track of SDK usage patterns
