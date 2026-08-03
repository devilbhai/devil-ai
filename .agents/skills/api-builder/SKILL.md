---
name: api-builder
description: API development. Endpoint design, authentication, rate limiting, versioning.
---

# API Builder

## When to Apply
Use this skill when building APIs: designing endpoints, implementing authentication, adding rate limiting, or managing API versions.

## Core Concepts
- REST: resource-oriented, HTTP methods map to CRUD operations
- Hono: lightweight web framework (used in this codebase)
- Authentication: JWT, API keys, OAuth2
- Rate limiting: token bucket, sliding window algorithms
- Versioning: URL path (`/v1/`), header, or query param

## Implementation

### Hono Route Structure
```typescript
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"

const app = new Hono()

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

app.post("/posts", zValidator("json", createPostSchema), async (c) => {
  const data = c.req.valid("json")
  const post = await createPost(data)
  return c.json(post, 201)
})
```

### Authentication Middleware
```typescript
import { createMiddleware } from "hono/factory"

const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return c.json({ error: "Unauthorized" }, 401)

  const user = await verifyToken(token)
  if (!user) return c.json({ error: "Invalid token" }, 401)

  c.set("user", user)
  await next()
})

app.use("/api/*", authMiddleware)
```

### Rate Limiting
```typescript
import { rateLimiter } from "hono/rate-limiter"

app.use("/api/*", rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,           // 100 requests per window
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
}))
```

### Error Handling
```typescript
app.onError((err, c) => {
  if (err instanceof z.ZodError) {
    return c.json({ error: "Validation failed", details: err.errors }, 400)
  }
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status)
  }
  logger.error("Unhandled error", { err })
  return c.json({ error: "Internal server error" }, 500)
})
```

### API Versioning
```typescript
const v1 = new Hono()
const v2 = new Hono()

v1.get("/users/:id", getUserV1)
v2.get("/users/:id", getUserV2)

app.route("/v1", v1)
app.route("/v2", v2)
```

## Best Practices
- Use plural nouns for resources (`/users` not `/user`)
- Return appropriate HTTP status codes (201 Created, 404 Not Found)
- Validate all input with Zod schemas
- Rate limit public endpoints; trust internal services
- Version APIs before making breaking changes
- Use consistent error response format: `{ error: string, details?: unknown }`
