---
name: javascript-expert
description: Modern JavaScript. ES6+, async patterns, modules, performance, security.
---

# JavaScript Expert

## When to Apply
Use this skill when building or maintaining modern JavaScript applications, including browser apps, Node.js backends, and library development.

## Core Concepts
- **ES6+ Features**: Destructuring, spread/rest, optional chaining, nullish coalescing, template literals, tagged templates
- **Async Patterns**: Promises, async/await, Promise.all/allSettled/race, generators, async iterators
- **Modules**: ES modules, dynamic imports, tree shaking, barrel exports, circular dependency detection
- **Functions**: Closures, higher-order functions, currying, partial application, composition
- **Objects & Prototypes**: Prototypal inheritance, Proxy, Reflect, Symbols, WeakRef, FinalizationRegistry
- **Performance**: Memory management, requestAnimationFrame, Web Workers, shared array buffers, profiling
- **Security**: XSS prevention, CSP, sanitization, CORS, input validation, prototype pollution

## Implementation
```javascript
// Advanced async patterns
async function fetchMultiple(urls) {
  const results = await Promise.allSettled(
    urls.map(url => fetch(url).then(r => r.json()))
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
}

// Async iterator for streaming data
async function* paginateFetch(baseUrl, pageSize = 10) {
  let page = 1
  while (true) {
    const res = await fetch(`${baseUrl}?page=${page}&size=${pageSize}`)
    const data = await res.json()
    if (data.items.length === 0) break
    yield data.items
    page++
  }
}

for await (const batch of paginateFetch('/api/users')) {
  processBatch(batch)
}

// Currying and composition
const curry = (fn) => {
  const arity = fn.length
  return function curried(...args) {
    if (args.length >= arity) return fn(...args)
    return (...moreArgs) => curried(...args, ...moreArgs)
  }
}

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)

const processUser = pipe(
  (user) => ({ ...user, name: user.name.trim() }),
  (user) => ({ ...user, email: user.email.toLowerCase() }),
  (user) => ({ ...user, role: user.role ?? 'user' })
)

// Proxy for reactive objects and validation
function reactive(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop]
      obj[prop] = value
      if (oldValue !== value) onChange(prop, value, oldValue)
      return true
    }
  })
}

// Memory-efficient WeakRef caching
class Cache {
  #cache = new Map()

  set(key, value) {
    this.#cache.set(key, new WeakRef(value))
  }

  get(key) {
    const ref = this.#cache.get(key)
    if (!ref) return undefined
    const value = ref.deref()
    if (value === undefined) {
      this.#cache.delete(key)
      return undefined
    }
    return value
  }
}

// Security: DOMPurify-style sanitization
function sanitizeInput(input) {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// Web Worker offloading
const heavyWorker = new Worker(new URL('./heavy-compute.js', import.meta.url))
heavyWorker.postMessage({ data: largeDataset })
heavyWorker.onmessage = (e) => console.log('Result:', e.data)
```

## Best Practices
- Use `const` by default, `let` when reassignment is needed, never `var`
- Prefer optional chaining (`?.`) and nullish coalescing (`??`) over verbose checks
- Use `Promise.allSettled()` when partial failures are acceptable
- Avoid deep nesting with early returns and guard clauses
- Use `WeakRef` and `WeakMap` for caches to prevent memory leaks
- Sanitize all user input before rendering DOM or using in queries
- Use `structuredClone()` for deep copying objects (avoids serialization issues)
- Name all functions and use descriptive variable names for debugging
