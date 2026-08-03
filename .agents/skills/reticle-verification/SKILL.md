# Reticle Verification Skill

## What is Reticle

Reticle is the **proof layer for AI agents**. It instruments your running app from the inside and feeds your agent a pass/fail **verdict with the `file:line` to fix** after every edit.

**Unlike screenshots or DOM tools**, Reticle reads:
- Network responses (status, timing, cardinality)
- App store/state (Redux, Zustand, Jotai, context)
- Console errors and warnings
- React component tree and commit stream
- Custom signals (your app's events)

**Key difference:** A page can look perfect on screen while a `500` fires underneath. Playwright sees the page. Reticle sees the program.

## When to Use Reticle

Use Reticle when:
- Verifying React/Next.js apps you own
- Catching silent bugs (500s, state mismatches, console errors)
- Running regression suites (deterministic replay, 0% flake)
- Multi-agent verification (one browser, isolated contexts)
- Need `file:line` precision for fixes

Use Playwright when:
- Testing third-party sites
- Need cross-browser (WebKit/Firefox)
- True pixel/visual regression testing
- Network mocking scenarios

Use DevTools when:
- Protocol-level network/performance debugging
- Raw CDP access needed

## Installation

### Quick Setup (Recommended)

Add to your agent prompt:
```
Follow https://raw.githubusercontent.com/reticlehq/reticle/main/SKILL.md
```

### Manual Setup

```bash
# Install
npm i -D @reticlehq/core

# Register MCP server (Claude Code)
claude mcp add reticle -s user -- npx @reticlehq/core mcp

# Or for OpenCode
opencode skill add https://raw.githubusercontent.com/reticlehq/reticle/main/SKILL.md
```

### Connect SDK in App

```typescript
// main.tsx or dev entry point
import { reticle } from '@reticlehq/core'

if (import.meta.env.DEV) {
  reticle.connect({ session: 'my-app' })
}

// For React component → file:line mapping
import { install } from '@reticlehq/core'
install()
```

## Core Tools

### reticle_assert
Assert over multiple checks in one call. Returns pass/fail with evidence.

```typescript
reticle_assert({
  predicate: {
    allOf: [
      { kind: "net", method: "POST", urlContains: "/api/order", status: 200 },
      { kind: "element", query: { role: "dialog", name: "Order confirmed" }, state: "visible" },
      { kind: "signal", name: "order:saved" },
      { kind: "console", level: "error", absent: true }
    ]
  }
})
// Returns: { pass: boolean, evidence: {...}, failureReason: string, source: { file, line } }
```

### reticle_flow_verify
Record a flow once, replay it deterministically. No model needed, ~47 tokens for a 4-flow suite.

```typescript
// Record a flow
reticle_flow_record({ name: "checkout" })

// Replay it
reticle_flow_verify({ name: "checkout" })
```

### reticle_lease_acquire / reticle_lease_release
Multi-agent support. One browser, isolated contexts per agent.

```typescript
const session = await reticle_lease_acquire()
// Run verification in isolated context
await reticle_lease_release({ sessionId: session.id })
```

## Predicate Types

| Kind | What it checks | Example |
|------|---------------|---------|
| `net` | Network requests/responses | `{ kind: "net", method: "GET", urlContains: "/api", status: 200 }` |
| `element` | DOM elements | `{ kind: "element", query: { role: "button", name: "Submit" }, state: "visible" }` |
| `console` | Console messages | `{ kind: "console", level: "error", absent: true }` |
| `signal` | Custom app signals | `{ kind: "signal", name: "user:logged-in" }` |
| `state` | App state assertions | `{ kind: "state", path: "auth.user", equals: {...} }` |
| `react` | React component state | `{ kind: "react", component: "Counter", state: { count: 5 } }` |

## Benchmarks

| Metric | Reticle | Playwright (LLM re-drive) | Improvement |
|--------|---------|---------------------------|-------------|
| Bugs caught (10 injected) | 10/10 | 9/10 | +10% |
| False positives | 0 | 0 | - |
| Cost to re-run 4-flow suite | ~47 tokens | ~120,000 tokens | 2,574× |
| Flake rate | 0% | sampled | - |
| Multi-agent (16 flows, 8 contexts) | 5.2s | 35.4s | 6.78× |

## Status & Safety

- **Dev-only**: SDK is tree-shaken out of production builds
- **localhost-only**: Bridge binds to localhost
- **No telemetry**: Nothing leaves your machine
- **Apache-2.0 license**: Safe to embed

## Integration with Devil AI

Reticle can be used as:
1. **MCP server**: Register in OpenCode config
2. **Skill**: Load this skill when verifying React apps
3. **CLI tool**: Run `npx @reticlehq/core` for quick checks

For Devil AI specifically:
- Use to verify Electron renderer changes
- Check React component state after edits
- Validate IPC handlers via network predicates
- Monitor console for main process errors

## Common Patterns

### Login Flow Verification
```typescript
reticle_assert({
  predicate: {
    allOf: [
      { kind: "net", method: "POST", urlContains: "/api/login", status: 200 },
      { kind: "element", query: { role: "tab", name: "Dashboard" }, state: "visible" },
      { kind: "state", path: "auth.user", exists: true }
    ]
  }
})
```

### API Endpoint Check
```typescript
reticle_assert({
  predicate: {
    allOf: [
      { kind: "net", method: "GET", urlContains: "/api/projects", status: 200 },
      { kind: "console", level: "error", absent: true },
      { kind: "net", method: "GET", urlContains: "/api/projects", count: 1 }
    ]
  }
})
```

### State Invariant Check
```typescript
reticle_assert({
  predicate: {
    allOf: [
      { kind: "state", path: "cart.items", gte: 1 },
      { kind: "state", path: "cart.total", gt: 0 },
      { kind: "element", query: { role: "button", name: "Checkout" }, state: "enabled" }
    ]
  }
})
```
