---
name: chat-ui-patterns
description: Chat interface components, message rendering, streaming responses, input patterns, and real-time messaging for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Chat UI Patterns

Chat interface patterns for the Devil AI codebase.

## When to Apply

- Building chat interfaces
- Rendering messages
- Handling streaming responses
- Implementing input components
- Managing chat state

---

## 1. Message Components

### Message Bubble

```tsx
// ✅ components/chat/message-bubble.tsx
interface MessageBubbleProps {
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  isStreaming?: boolean
}

export function MessageBubble({ content, role, timestamp, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user"
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={content} />
        </div>
        
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
        
        <div className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-500"}`}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  )
}
```

### Message List

```tsx
// ✅ components/chat/message-list.tsx
import { useRef, useEffect } from "react"

interface MessageListProps {
  messages: Message[]
  isStreaming?: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          content={message.content}
          role={message.role}
          timestamp={new Date(message.timestamp)}
        />
      ))}
      
      {isStreaming && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
            <TypingIndicator />
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  )
}
```

### Typing Indicator

```tsx
// ✅ components/chat/typing-indicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  )
}
```

---

## 2. Input Components

### Chat Input

```tsx
// ✅ components/chat/chat-input.tsx
import { useState, useRef, useEffect } from "react"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])
  
  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage("")
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type a message..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
```

### Code Input

```tsx
// ✅ components/chat/code-input.tsx
interface CodeInputProps {
  language: string
  value: string
  onChange: (value: string) => void
}

export function CodeInput({ language, value, onChange }: CodeInputProps) {
  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{language}</span>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Copy
        </button>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900 text-gray-100 font-mono text-sm p-4 focus:outline-none"
        rows={10}
        spellCheck={false}
      />
    </div>
  )
}
```

---

## 3. Streaming Responses

### SSE Streaming

```typescript
// ✅ services/chat-stream.ts
export class ChatStream {
  private eventSource: EventSource | null = null
  
  connect(sessionId: string, onMessage: (chunk: string) => void): void {
    this.eventSource = new EventSource(`/api/sessions/${sessionId}/stream`)
    
    this.eventSource.addEventListener("chunk", (event) => {
      const data = JSON.parse(event.data)
      onMessage(data.content)
    })
    
    this.eventSource.addEventListener("done", () => {
      this.disconnect()
    })
    
    this.eventSource.onerror = (error) => {
      console.error("Stream error:", error)
      this.disconnect()
    }
  }
  
  disconnect(): void {
    this.eventSource?.close()
    this.eventSource = null
  }
}
```

### Streaming State

```typescript
// ✅ hooks/use-chat-stream.ts
import { useState, useCallback } from "react"

interface UseChatStreamReturn {
  isStreaming: boolean
  streamedContent: string
  startStream: (sessionId: string) => void
  stopStream: () => void
}

export function useChatStream(): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const [stream, setStream] = useState<ChatStream | null>(null)
  
  const startStream = useCallback((sessionId: string) => {
    const newStream = new ChatStream()
    
    setIsStreaming(true)
    setStreamedContent("")
    
    newStream.connect(sessionId, (chunk) => {
      setStreamedContent((prev) => prev + chunk)
    })
    
    setStream(newStream)
  }, [])
  
  const stopStream = useCallback(() => {
    stream?.disconnect()
    setIsStreaming(false)
    setStream(null)
  }, [stream])
  
  return { isStreaming, streamedContent, startStream, stopStream }
}
```

---

## 4. Markdown Rendering

### Markdown Renderer

```tsx
// ✅ components/chat/markdown-renderer.tsx
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          
          if (match) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            )
          }
          
          return (
            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

---

## 5. Chat State Management

### Chat Store

```typescript
// ✅ stores/chat-store.ts
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: number
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// ✅ Atoms
export const sessionsAtom = atomWithStorage<Session[]>("sessions", [])
export const activeSessionIdAtom = atom<string | null>(null)

export const activeSessionAtom = atom((get) => {
  const sessions = get(sessionsAtom)
  const activeId = get(activeSessionIdAtom)
  return sessions.find((s) => s.id === activeId) ?? null
})

// ✅ Actions
export const createSessionAtom = atom(null, (get, set, title?: string) => {
  const session: Session = {
    id: crypto.randomUUID(),
    title: title || "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  set(sessionsAtom, (prev) => [session, ...prev])
  set(activeSessionIdAtom, session.id)
  
  return session
})

export const addMessageAtom = atom(null, (get, set, { sessionId, message }: {
  sessionId: string
  message: Omit<Message, "id" | "timestamp">
}) => {
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  
  set(sessionsAtom, (prev) =>
    prev.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, newMessage],
            updatedAt: Date.now(),
          }
        : session
    )
  )
})
```

---

## 6. Chat Layout

### Main Chat Layout

```tsx
// ✅ components/chat/chat-layout.tsx
import { useAtomValue } from "jotai"
import { activeSessionAtom } from "@/stores/chat-store"

export function ChatLayout() {
  const session = useAtomValue(activeSessionAtom)
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <ChatHeader session={session} />
        </div>
        
        {/* Messages */}
        <MessageList messages={session?.messages ?? []} />
        
        {/* Input */}
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  )
}
```

### Chat Sidebar

```tsx
// ✅ components/chat/chat-sidebar.tsx
import { useAtomValue, useSetAtom } from "jotai"
import { sessionsAtom, activeSessionIdAtom, createSessionAtom } from "@/stores/chat-store"

export function ChatSidebar() {
  const sessions = useAtomValue(sessionsAtom)
  const setActiveSessionId = useSetAtom(activeSessionIdAtom)
  const createSession = useSetAtom(createSessionAtom)
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={() => createSession()}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2"
        >
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="font-medium truncate">{session.title}</div>
            <div className="text-sm text-gray-500">
              {session.messages.length} messages
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## 7. Best Practices

1. **Virtualize long lists** — Use react-window for many messages
2. **Auto-scroll to bottom** — Keep latest message visible
3. **Debounce input** — Don't send on every keystroke
4. **Handle streaming gracefully** — Show typing indicator
5. **Cache messages** — Use localStorage or database
6. **Optimize re-renders** — Memoize message components
7. **Handle errors** — Show retry options
8. **Mobile responsive** — Stack layout on small screens
9. **Keyboard navigation** — Support Enter to send
10. **Accessibility** — ARIA labels, screen reader support
