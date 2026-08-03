---
name: performance-web
description: Web performance optimization, Core Web Vitals, lazy loading, code splitting, and caching strategies for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Web Performance Patterns

Web performance optimization patterns for the Devil AI codebase.

## When to Apply

- Optimizing load times
- Reducing bundle size
- Improving runtime performance
- Implementing caching
- Measuring performance metrics

---

## 1. Core Web Vitals

### Metrics

```
LCP (Largest Contentful Paint) — Loading performance
  - Good: < 2.5s
  - Needs improvement: 2.5s - 4s
  - Poor: > 4s

FID (First Input Delay) — Interactivity
  - Good: < 100ms
  - Needs improvement: 100ms - 300ms
  - Poor: > 300ms

CLS (Cumulative Layout Shift) — Visual stability
  - Good: < 0.1
  - Needs improvement: 0.1 - 0.25
  - Poor: > 0.25
```

### Measurement

```typescript
// ✅ Measure Web Vitals
import { onLCP, onFID, onCLS } from "web-vitals"

function reportMetric(metric: { name: string; value: number; rating: string }) {
  console.log(`[${metric.name}] ${metric.value} (${metric.rating})`)
  
  // Send to analytics
  analytics.track("web-vital", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  })
}

onLCP(reportMetric)
onFID(reportMetric)
onCLS(reportMetric)
```

---

## 2. Lazy Loading

### Route-based Splitting

```typescript
// ✅ Lazy load routes
import { lazy, Suspense } from "react"

const ChatPage = lazy(() => import("./pages/ChatPage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage"))
const AdminPage = lazy(() => import("./pages/AdminPage"))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  )
}
```

### Component-based Splitting

```typescript
// ✅ Lazy load heavy components
const MarkdownEditor = lazy(() => import("./components/MarkdownEditor"))
const CodeEditor = lazy(() => import("./components/CodeEditor"))
const Chart = lazy(() => import("./components/Chart"))

function ChatMessage({ content, isCode }: Props) {
  return (
    <div>
      {isCode ? (
        <Suspense fallback={<CodePlaceholder />}>
          <CodeEditor value={content} readOnly />
        </Suspense>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </div>
  )
}
```

### Conditional Loading

```typescript
// ✅ Load based on feature flag
const AdvancedSettings = lazy(() => import("./components/AdvancedSettings"))

function Settings() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowAdvanced(true)}>
        Show Advanced Settings
      </button>
      
      {showAdvanced && (
        <Suspense fallback={<div>Loading...</div>}>
          <AdvancedSettings />
        </Suspense>
      )}
    </div>
  )
}
```

---

## 3. Code Splitting

### Dynamic Imports

```typescript
// ✅ Dynamic import for heavy libraries
async function exportToPDF(content: string) {
  const { default: pdfMake } = await import("pdfmake/build/pdfmake")
  const { default: pdfFonts } = await import("pdfmake/build/vfs_fonts")
  
  pdfMake.vfs = pdfFonts.pdfMake.vfs
  
  const doc = {
    content: [{ text: content }],
  }
  
  pdfMake.createPdf(doc).download("document.pdf")
}

// ✅ Dynamic import for features
async function loadPlugin(pluginName: string) {
  const plugin = await import(`./plugins/${pluginName}`)
  return plugin.default
}
```

### Split Points

```typescript
// ✅ Identify split points
// 1. Routes (most important)
// 2. Heavy components (editors, charts)
// 3. Feature modules (settings, admin)
// 4. Third-party libraries (moment, lodash)

// ✅ Use Vite's manual chunks
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          "utils-vendor": ["date-fns", "lodash"],
        },
      },
    },
  },
})
```

---

## 4. Image Optimization

### Modern Formats

```tsx
// ✅ Use modern image formats
function OptimizedImage({ src, alt, width, height }: Props) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <source srcSet={`${src}.avif`} type="image/avif" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  )
}
```

### Responsive Images

```tsx
// ✅ Responsive images with srcSet
function ResponsiveImage({ src, alt }: Props) {
  return (
    <img
      src={`${src}?w=800`}
      srcSet={`${src}?w=400 400w, ${src}?w=800 800w, ${src}?w=1200 1200w`}
      sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
      alt={alt}
      loading="lazy"
    />
  )
}
```

### Image Placeholders

```tsx
// ✅ Blur placeholder
function ImageWithPlaceholder({ src, alt }: Props) {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}
```

---

## 5. Caching Strategies

### HTTP Caching

```typescript
// ✅ Set cache headers
// In server configuration
app.use("/static/*", async (c, next) => {
  await next()
  c.header("Cache-Control", "public, max-age=31536000, immutable")
})

app.use("/api/*", async (c, next) => {
  await next()
  c.header("Cache-Control", "private, no-cache, must-revalidate")
})
```

### Service Worker Caching

```typescript
// ✅ Cache-first strategy
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})

// ✅ Network-first strategy
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open("v1").then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
```

### React Query Caching

```typescript
// ✅ Configure query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ✅ Prefetch data
async function prefetchUser(userId: string) {
  await queryClient.prefetchQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  })
}
```

---

## 6. Bundle Optimization

### Tree Shaking

```typescript
// ✅ Import only what you need
// ❌ Bad - imports entire library
import _ from "lodash"
_.debounce(fn, 300)

// ✅ Good - import specific function
import debounce from "lodash/debounce"
debounce(fn, 300)

// ✅ Good - use native methods
const debounce = (fn: Function, ms: number) => {
  let timer: NodeJS.Timeout
  return (...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
```

### Analyze Bundle

```bash
# Install bundle analyzer
bun add -D vite-bundle-visualizer

# Run analysis
bun run build && bunx vite-bundle-visualizer
```

### Remove Dead Code

```typescript
// ✅ Use TypeScript to find unused code
// tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}

// ✅ ESLint rule
// .eslintrc.js
{
  "rules": {
    "no-unused-vars": "error"
  }
}
```

---

## 7. Runtime Performance

### Memoization

```typescript
// ✅ useMemo for expensive computations
function SortedList({ items, sortBy }: Props) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "date") return b.createdAt - a.createdAt
      return 0
    })
  }, [items, sortBy])
  
  return <div>{sortedItems.map(renderItem)}</div>
}

// ✅ useCallback for stable references
function Parent() {
  const [count, setCount] = useState(0)
  
  const handleClick = useCallback(() => {
    setCount((c) => c + 1)
  }, [])
  
  return <Child onClick={handleClick} />
}
```

### Virtualization

```typescript
// ✅ Virtualize long lists
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Debouncing

```typescript
// ✅ Debounce input
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("")
  
  const debouncedSearch = useMemo(
    () => debounce((q: string) => onSearch(q), 300),
    [onSearch]
  )
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }
  
  return <input value={query} onChange={handleChange} />
}
```

---

## 8. Loading Performance

### Preloading

```tsx
// ✅ Preload critical resources
function App() {
  return (
    <head>
      <link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin="" />
      <link rel="preconnect" href="https://api.example.com" />
      <link rel="dns-prefetch" href="https://analytics.example.com" />
    </head>
  )
}
```

### Critical CSS

```typescript
// ✅ Inline critical CSS
// In index.html
<style>
  /* Critical CSS here */
  body { margin: 0; font-family: system-ui; }
</style>
<link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'" />
```

### Script Loading

```html
<!-- ✅ Async/defer scripts -->
<script src="/analytics.js" async></script>
<script src="/app.js" defer></script>

<!-- ✅ Module scripts are deferred by default -->
<script type="module" src="/app.js"></script>
```

---

## 9. Measuring Performance

### Lighthouse

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --output=html

# Run in CI
npx lighthouse http://localhost:3000 --output=json --chrome-flags="--headless"
```

### Web Vitals Library

```typescript
// ✅ Measure Web Vitals
import { onLCP, onFID, onCLS, onFCP, onTTFB } from "web-vitals"

function sendToAnalytics(metric: Metric) {
  console.log(`${metric.name}: ${metric.value}`)
  
  // Send to your analytics
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
  })
}

onLCP(sendToAnalytics)
onFID(sendToAnalytics)
onCLS(sendToAnalytics)
onFCP(sendToAnalytics)
onTTFB(sendToAnalytics)
```

### React Profiler

```typescript
// ✅ Profile components
import { Profiler } from "react"

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`[${id}] ${phase}: ${actualDuration}ms`)
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <AppContent />
    </Profiler>
  )
}
```

---

## 10. Best Practices

1. **Measure first** — Don't optimize without data
2. **Lazy load routes** — Most important optimization
3. **Code split components** — Heavy components should be lazy
4. **Optimize images** — Use modern formats, lazy loading
5. **Cache aggressively** — Static assets, API responses
6. **Minimize bundle size** — Remove dead code, tree shake
7. **Use virtualization** — For long lists
8. **Debounce expensive operations** — Input handlers, scroll events
9. **Preload critical resources** — Fonts, API endpoints
10. **Monitor in production** — Track Web Vitals continuously
