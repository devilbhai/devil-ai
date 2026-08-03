---
name: offline-mode
description: Offline functionality. Data caching, sync management, conflict resolution.
---

# Offline Mode

## When to Apply
Use this skill when implementing offline-capable applications, data caching strategies, or graceful degradation when connectivity is lost.

## Core Concepts
- **Service workers**: Intercept network requests for offline fallbacks
- **Cache strategies**: Cache-first, network-first, stale-while-revalidate
- **Offline storage**: IndexedDB, Cache API, localStorage
- **Sync queue**: Queue mutations while offline, replay when online
- **Conflict resolution**: Handle simultaneous edits from offline clients

## Implementation
```typescript
// Online/offline detection
function setupConnectivity() {
  window.addEventListener("online", () => syncPendingChanges())
  window.addEventListener("offline", () => enableOfflineMode())
}

// IndexedDB storage
async function saveOffline<T>(key: string, data: T) {
  const db = await openDB("offline-store", 1, {
    upgrade(db) { db.createObjectStore("data") },
  })
  await db.put("data", data, key)
}

// Sync queue
interface PendingChange {
  id: string
  action: string
  payload: unknown
  timestamp: number
}

async function queueChange(change: PendingChange) {
  const queue = JSON.parse(localStorage.getItem("sync-queue") ?? "[]")
  queue.push(change)
  localStorage.setItem("sync-queue", JSON.stringify(queue))
}

async function syncPendingChanges() {
  const queue: PendingChange[] = JSON.parse(localStorage.getItem("sync-queue") ?? "[]")
  for (const change of queue) {
    await applyChange(change)
  }
  localStorage.setItem("sync-queue", "[]")
}
```

## Best Practices
- Show clear offline/online status indicator
- Queue all write operations while offline
- Handle conflict resolution with last-write-wins or merge strategies
- Cache critical assets for immediate offline access
- Test offline mode regularly — don't assume connectivity
- Provide manual "retry sync" option for users
