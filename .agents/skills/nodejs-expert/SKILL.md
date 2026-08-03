---
name: nodejs-expert
description: Node.js development. Event loop, streams, clusters, worker threads, native modules.
---

# Node.js Expert

## When to Apply
Use this skill when building or optimizing Node.js applications, including server-side logic, CLI tools, APIs, real-time systems, and performance-critical backends.

## Core Concepts
- **Event Loop**: Phases, microtasks, nextTick, setImmediate, blocking vs non-blocking operations
- **Streams**: Readable, Writable, Transform, Duplex, backpressure handling, pipeline composition
- **Clusters**: Multi-process architecture, load balancing, graceful shutdown, IPC communication
- **Worker Threads**: SharedArrayBuffer, MessagePort, CPU-intensive task offloading
- **Native Modules**: C++ addons, N-API, node-gyp, WebAssembly integration
- **Buffer & Binary Data**: Encoding, manipulation, memory-efficient handling
- **Error Handling**: Uncaught exceptions, unhandled rejections, domain-based handling

## Implementation
```javascript
// Stream pipeline with error handling and backpressure
import { createReadStream, createWriteStream } from 'node:fs'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'

async function compressFile(input, output) {
  await pipeline(
    createReadStream(input),
    createGzip({ level: 9 }),
    createWriteStream(output)
  )
}

// Worker thread for CPU-intensive tasks
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

if (isMainThread) {
  function runTask(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: data })
      worker.on('message', resolve)
      worker.on('error', reject)
    })
  }
} else {
  const result = heavyComputation(workerData)
  parentPort.postMessage(result)
}

// Cluster for multi-core scaling
import cluster from 'node:cluster'
import os from 'node:os'

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism()
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`)
    cluster.fork()
  })
} else {
  startServer()
}

// Graceful shutdown pattern
const server = app.listen(3000)

const shutdown = async (signal) => {
  console.log(`${signal} received, starting graceful shutdown`)
  server.close(async () => {
    await db.disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

## Best Practices
- Never block the event loop with synchronous operations
- Use `--max-old-space-size` to manage memory for large applications
- Prefer `stream/promises` over event-based stream handling
- Use `AsyncLocalStorage` for request-scoped context in async code
- Profile with `--inspect` and Chrome DevTools for memory leaks
- Use `worker_threads` for CPU-intensive tasks, not clusters
- Handle `unhandledRejection` to prevent silent failures
- Use `node:` prefix for all built-in module imports
