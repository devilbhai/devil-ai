---
name: session-restore
description: Session persistence. State serialization, session recovery, auto-save.
---

# Session Restore

## When to Apply
Use this skill when implementing session persistence, auto-save functionality, or recovering user state across browser/app restarts.

## Core Concepts
- **State serialization**: Convert complex objects to storable format
- **Storage backends**: localStorage, sessionStorage, IndexedDB, file system
- **Auto-save strategies**: Debounced saves, dirty flagging, periodic sync
- **Recovery mechanisms**: Graceful degradation on corrupted data
- **Cross-tab synchronization**: BroadcastChannel for multi-tab state

## Implementation
```typescript
// localStorage with versioning
interface SessionData {
  version: number
  timestamp: number
  state: unknown
}

function saveSession(key: string, state: unknown) {
  const data: SessionData = { version: 1, timestamp: Date.now(), state }
  localStorage.setItem(key, JSON.stringify(data))
}

function loadSession<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const data = JSON.parse(raw) as SessionData
    if (data.version !== 1) return fallback
    return data.state as T
  } catch {
    return fallback
  }
}

// Auto-save with debounce
let saveTimeout: ReturnType<typeof setTimeout>
function autoSave(state: unknown) {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveSession("app-state", state), 1000)
}
```

## Best Practices
- Version serialized data to handle schema changes
- Add expiration/TTL to stale session data
- Use IndexedDB for large or complex data (exceeds localStorage 5MB)
- Validate data on restore — don't trust stored state blindly
- Provide manual "save" and "restore" actions alongside auto-save
- Clear session data on logout for security-sensitive apps
