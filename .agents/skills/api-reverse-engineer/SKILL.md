---
name: api-reverse-engineer
description: Reverse engineer undocumented APIs, analyze traffic, and generate client code.
---

# API Reverse Engineer

## When to Apply
Use this skill when analyzing undocumented APIs, inspecting network traffic, generating API clients, or understanding how external services work.

## Core Concepts
- HTTP traffic analysis
- Request/response pattern detection
- Authentication mechanism discovery
- Endpoint mapping
- Schema inference

## Implementation

### Capture and Analyze
```typescript
interface APIDiscovery {
  baseUrl: string
  endpoints: Endpoint[]
  authType: "bearer" | "basic" | "api-key" | "cookie" | "none"
  rateLimit?: { requests: number; window: string }
}

interface Endpoint {
  method: string
  path: string
  headers: Record<string, string>
  queryParams?: Record<string, string>
  body?: any
  response?: any
  pagination?: "cursor" | "offset" | "next-link"
}
```

### Generate Client
```typescript
function generateClient(discovery: APIDiscovery): string {
  const lines: string[] = []
  for (const ep of discovery.endpoints) {
    lines.push(`async function ${ep.method.toLowerCase()}${ep.path.replace(/\//g, '_')}(`)
    lines.push(`  ${ep.body ? 'body: ' + typeof ep.body : ''}`)
    lines.push(`): Promise<${typeof ep.response}> {`)
    lines.push(`  return request('${ep.method}', '${ep.path}', body)`)
    lines.push(`}`)
  }
  return lines.join('\n')
}
```

### Traffic Analysis Tools
- Browser DevTools Network tab
- Charles Proxy / mitmproxy
- Wireshark for low-level
- Postman interceptor

## Best Practices
- Start with public documentation (if any)
- Use browser DevTools to capture traffic
- Look for API versioning patterns
- Check for rate limiting headers
- Test with minimal requests during discovery
- Document findings as you go
