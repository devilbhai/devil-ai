---
name: ram-monitor
description: Memory usage monitoring. Heap tracking, leak detection, garbage collection analysis.
---

# RAM Monitor

## When to Apply
Use this skill when monitoring memory usage: tracking heap size, detecting memory leaks, analyzing garbage collection behavior, or optimizing memory consumption.

## Core Concepts
- Process memory: RSS (resident), V8 heap, external, array buffers
- System memory: total, free, available, buffers/cached
- Memory leaks: unreferenced objects not collected due to lingering references
- GC events: major (full) vs minor (scavenge) collections
- Heap snapshots: capture and diff to find leak sources

## Implementation

### Node.js Memory Tracking
```typescript
function getMemoryUsage() {
  const mem = process.memoryUsage()
  return {
    rss: mem.rss / 1024 / 1024,        // Total memory allocated
    heapTotal: mem.heapTotal / 1024 / 1024, // V8 heap total
    heapUsed: mem.heapUsed / 1024 / 1024,   // V8 heap used
    external: mem.external / 1024 / 1024,    // C++ objects bound to JS
    arrayBuffers: (mem.arrayBuffers || 0) / 1024 / 1024,
  }
}

// Periodic monitoring
setInterval(() => {
  console.log(getMemoryUsage())
}, 5000)
```

### System Memory Check
```bash
# Linux
free -m
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Buffers|Cached"

# macOS
vm_stat
top -l 1 | head -10
```

### Heap Snapshot Analysis
```bash
# Take heap snapshot
node --heapsnapshot-signal=SIGUSR2 app.js

# Trigger via Chrome DevTools
kill -USR2 <pid>
```

### Garbage Collection Monitoring
```bash
# Enable GC tracing
node --trace-gc app.js

# Verbose GC logging
node --trace-gc --trace-gc-verbose app.js
```

### Memory Leak Detection
```typescript
// Use WeakRef and FinalizationRegistry
const registry = new FinalizationRegistry((heldValue: string) => {
  console.log(`Object ${heldValue} was garbage collected`)
})

function trackObject(obj: object, id: string) {
  registry.register(obj, id)
}
```

## Best Practices
- Monitor `heapUsed` vs `heapTotal` ratio; high ratio indicates pressure
- Take heap snapshots at different time points and diff them
- Use `--max-old-space-size` to limit V8 heap growth
- Avoid retaining references in closures or global maps
- Profile with Chrome DevTools Memory tab for leak visualization
