---
name: sync-manager
description: Data synchronization. Multi-device sync, conflict resolution, real-time updates.
---

# Sync Manager

## When to Apply
Use this skill when building multi-device synchronization, real-time collaboration, or distributed data systems.

## Core Concepts
- **CRDTs**: Conflict-free replicated data types for merge-free sync
- **Operational transformation**: Transform concurrent edits for consistency
- **Sync protocols**: WebSocket, SSE, polling-based sync
- **Vector clocks**: Track causality across distributed edits
- **Delta sync**: Transfer only changed data, not full state

## Implementation
```typescript
// Simple sync state tracking
interface SyncState {
  lastSynced: number
  device: string
  version: number
}

// Merge two states with conflict detection
function mergeState<T extends Record<string, unknown>>(
  local: T & { _sync: SyncState },
  remote: T & { _sync: SyncState }
): T & { _sync: SyncState } {
  if (local._sync.version > remote._sync.version) {
    return { ...remote, ...local, _sync: { ...local._sync, version: local._sync.version + 1 } }
  }
  if (remote._sync.version > local._sync.version) {
    return { ...local, ...remote, _sync: { ...remote._sync, version: remote._sync.version + 1 } }
  }
  // Conflict: same version — use timestamp
  return local._sync.lastSynced > remote._sync.lastSynced
    ? { ...remote, ...local, _sync: { ...local._sync, version: local._sync.version + 1 } }
    : { ...local, ...remote, _sync: { ...remote._sync, version: remote._sync.version + 1 } }
}

// WebSocket sync
function connectSync(url: string, onSync: (data: unknown) => void) {
  const ws = new WebSocket(url)
  ws.onmessage = (event) => onSync(JSON.parse(event.data))
  ws.onclose = () => setTimeout(() => connectSync(url, onSync), 3000)
  return ws
}
```

## Best Practices
- Use CRDTs for append-only or counter-based data
- Implement exponential backoff for reconnection
- Show sync status indicator (synced, syncing, conflict)
- Allow manual conflict resolution when auto-merge fails
- Batch small changes to reduce sync overhead
- Track sync history for debugging distributed issues
