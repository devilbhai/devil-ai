---
name: devtools
description: Developer tools, debugging workflows, React DevTools, performance profiling, and development environment for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Developer Tools Patterns

Developer tools and debugging workflows for the Devil AI codebase.

## When to Apply

- Setting up development environment
- Debugging applications
- Profiling performance
- Inspecting components
- Analyzing bundle size

---

## 1. React DevTools

### Setup

```bash
# ✅ Install React DevTools
bun add -D @react-devtools/cli

# ✅ Or use browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

### Profiling

```tsx
// ✅ Enable profiling in development
import { unstable_Profiler as Profiler } from "react"

function onRenderCallback(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
  interactions: Set<Interaction>
) {
  console.log(`[${id}] ${phase}:`, {
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  })
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <AppContent />
    </Profiler>
  )
}
```

### Component Inspector

```
✅ Use React DevTools to:
- Inspect component tree
- View/edit props and state
- Check hooks (useState, useEffect, etc.)
- Profile performance
- Highlight re-renders
```

---

## 2. Jotai DevTools

### Setup

```bash
# ✅ Install Jotai DevTools
bun add -D jotai-devtools
```

### Usage

```tsx
// ✅ Add to app
import { useAtomsDevtools } from "jotai-devtools"

function App() {
  useAtomsDevtools("Devil AI")
  return <AppContent />
}
```

### Features

```
✅ Jotai DevTools allows:
- View all atoms and their values
- Track atom subscriptions
- Monitor state changes
- Debug derived atoms
- Export/import state
```

---

## 3. TanStack Query DevTools

### Setup

```bash
# ✅ Install React Query DevTools
bun add -D @tanstack/react-query-devtools
```

### Usage

```tsx
// ✅ Add to app
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Features

```
✅ React Query DevTools allows:
- View all queries and their status
- Monitor cache state
- Inspect query data
- Refetch queries manually
- Track query key patterns
```

---

## 4. Biome DevTools

### Linting

```bash
# ✅ Run Biome linter
bunx biome check .

# ✅ Auto-fix issues
bunx biome check --write .

# ✅ Check specific file
bunx biome check src/components/App.tsx
```

### Formatting

```bash
# ✅ Format code
bunx biome format --write .

# ✅ Check formatting
bunx biome format .
```

### Configuration

```json
// ✅ biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

---

## 5. TypeScript DevTools

### Type Checking

```bash
# ✅ Type check
bun run check-types

# ✅ Watch mode
bun run check-types --watch

# ✅ Generate declaration files
bun run build --declaration
```

### VS Code Integration

```json
// ✅ .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome"
}
```

### TypeScript Errors

```bash
# ✅ Get detailed error info
bunx tsc --noEmit --pretty

# ✅ Watch for errors
bunx tsc --noEmit --watch
```

---

## 6. Electron DevTools

### DevTools Extension

```typescript
// ✅ main/devtools.ts
import { BrowserWindow, session } from "electron"
import { REACT_DEVTTOOLS_PATH } from "electron-devtools-installer"

export async function installDevTools(window: BrowserWindow): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    return
  }
  
  try {
    await session.defaultSession.loadExtension(REACT_DEVTTOOLS_PATH, {
      allowFileAccess: true,
    })
    
    console.log("[DevTools] React DevTools installed")
  } catch (error) {
    console.error("[DevTools] Failed to install:", error)
  }
}
```

### DevTools Window

```typescript
// ✅ Open DevTools in separate window
export function openDevTools(window: BrowserWindow): void {
  if (process.env.NODE_ENV !== "development") {
    return
  }
  
  window.webContents.openDevTools({ mode: "detach" })
}
```

---

## 7. Bundle Analysis

### Vite Bundle Analyzer

```bash
# ✅ Install bundle analyzer
bun add -D vite-bundle-visualizer

# ✅ Analyze bundle
bun run build --analyze

# ✅ Or use plugin
# vite.config.ts
import { visualizer } from "vite-bundle-visualizer"

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

### Bundle Size Monitoring

```json
// ✅ package.json
{
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "100 kB"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "20 kB"
    }
  ]
}
```

---

## 8. Network Debugging

### API Request Logging

```typescript
// ✅ main/network-logger.ts
import { session } from "electron"

export function setupNetworkLogger(): void {
  if (process.env.NODE_ENV !== "development") {
    return
  }
  
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    console.log(`[Network] ${details.method} ${details.url}`)
    callback({ cancel: false })
  })
  
  session.defaultSession.webRequest.onCompleted((details) => {
    console.log(`[Network] ${details.statusCode} ${details.url}`)
  })
}
```

### Proxy Configuration

```typescript
// ✅ Set proxy for debugging
import { session } from "electron"

export function setProxy(host: string, port: number): void {
  session.defaultSession.setProxy({
    proxyRules: `http://${host}:${port}`,
  })
}
```

---

## 9. Performance Profiling

### Chrome DevTools

```
✅ Performance Tab:
1. Open DevTools → Performance tab
2. Click Record
3. Perform actions
4. Stop recording
5. Analyze:
   - FPS (frames per second)
   - CPU usage
   - Memory usage
   - Long tasks

✅ Memory Tab:
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare snapshots to find memory leaks
```

### React Performance

```typescript
// ✅ Track re-renders
if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render")
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  })
}
```

---

## 10. Best Practices

1. **Use React DevTools** — Inspect component tree and state
2. **Enable profiling** — Find performance bottlenecks
3. **Use Biome** — Consistent code style
4. **Type check regularly** — Catch errors early
5. **Analyze bundle size** — Keep app fast
6. **Monitor network requests** — Debug API calls
7. **Use DevTools extensions** — Enhance debugging
8. **Profile performance** — Optimize slow components
9. **Document debugging steps** — Help team debug faster
10. **Keep dev dependencies updated** — Get latest features
