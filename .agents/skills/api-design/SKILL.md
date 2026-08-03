---
name: api-design
description: REST API design patterns, Hono routes, validation, error handling, and middleware for the Devil AI backend.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# API Design Patterns

REST API design patterns for the Devil AI backend (Hono + Bun).

## When to Apply

- Creating new API routes
- Implementing validation
- Designing error responses
- Adding middleware
- Structuring API endpoints

---

## 1. Route Organization

### File Structure

```
apps/server/src/
├── routes/
│   ├── index.ts          # Route aggregator
│   ├── users.ts          # /api/users
│   ├── sessions.ts       # /api/sessions
│   └── health.ts         # /api/health
├── middleware/
│   ├── auth.ts
│   ├── cors.ts
│   └── logging.ts
├── schemas/
│   ├── user.ts
│   └── session.ts
└── index.ts              # Entry point
```

### Route Registration

```typescript
// ✅ routes/index.ts
import { Hono } from "hono"
import { userRoutes } from "./users"
import { sessionRoutes } from "./sessions"
import { healthRoutes } from "./health"

const api = new Hono()

api.route("/health", healthRoutes)
api.route("/users", userRoutes)
api.route("/sessions", sessionRoutes)

export { api }
```

### Route Files

```typescript
// ✅ routes/users.ts
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createUserSchema, updateUserSchema } from "../schemas/user"
import { UserService } from "../services/user"

const userRoutes = new Hono()

userRoutes.get("/", async (c) => {
  const users = await UserService.findAll()
  return c.json(users)
})

userRoutes.get("/:id", async (c) => {
  const user = await UserService.findById(c.req.param("id"))
  if (!user) {
    return c.json({ error: "User not found" }, 404)
  }
  return c.json(user)
})

userRoutes.post(
  "/",
  zValidator("json", createUserSchema),
  async (c) => {
    const data = c.req.valid("json")
    const user = await UserService.create(data)
    return c.json(user, 201)
  }
)

userRoutes.put(
  "/:id",
  zValidator("json", updateUserSchema),
  async (c) => {
    const user = await UserService.update(
      c.req.param("id"),
      c.req.valid("json")
    )
    return c.json(user)
  }
)

userRoutes.delete("/:id", async (c) => {
  await UserService.delete(c.req.param("id"))
  return c.json({ success: true })
})

export { userRoutes }
```

---

## 2. Validation with Zod

### Schema Definitions

```typescript
// ✅ schemas/user.ts
import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]).default("user"),
})

export const updateUserSchema = createUserSchema.partial()

export const userIdSchema = z.object({
  id: z.string().uuid(),
})

export type CreateUserDTO = z.infer<typeof createUserSchema>
export type UpdateUserDTO = z.infer<typeof updateUserSchema>
```

### Query Validation

```typescript
// ✅ schemas/pagination.ts
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.string().optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>

// ✅ Usage in route
userRoutes.get(
  "/",
  zValidator("query", paginationSchema),
  async (c) => {
    const { page, limit, sort, sortBy } = c.req.valid("query")
    const users = await UserService.findAll({ page, limit, sort, sortBy })
    return c.json(users)
  }
)
```

### Nested Validation

```typescript
// ✅ schemas/session.ts
import { z } from "zod"

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(["user", "assistant", "system"]),
})

export const createSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  messages: z.array(messageSchema).default([]),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
})

export const addMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(["user", "assistant", "system"]),
})
```

---

## 3. Error Handling

### Error Response Format

```typescript
// ✅ types/errors.ts
export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: Record<string, string[]>
}

// ✅ Standard error responses
export const ErrorResponses = {
  badRequest: (message: string, details?: Record<string, string[]>): ApiError => ({
    error: "Bad Request",
    message,
    statusCode: 400,
    details,
  }),
  
  unauthorized: (message = "Unauthorized"): ApiError => ({
    error: "Unauthorized",
    message,
    statusCode: 401,
  }),
  
  forbidden: (message = "Forbidden"): ApiError => ({
    error: "Forbidden",
    message,
    statusCode: 403,
  }),
  
  notFound: (resource: string): ApiError => ({
    error: "Not Found",
    message: `${resource} not found`,
    statusCode: 404,
  }),
  
  conflict: (message: string): ApiError => ({
    error: "Conflict",
    message,
    statusCode: 409,
  }),
  
  internal: (message = "Internal Server Error"): ApiError => ({
    error: "Internal Server Error",
    message,
    statusCode: 500,
  }),
}
```

### Error Handler Middleware

```typescript
// ✅ middleware/error-handler.ts
import { MiddlewareHandler } from "hono"
import { ZodError } from "zod"

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error("[API Error]", error)
    
    // Zod validation error
    if (error instanceof ZodError) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid request data",
          statusCode: 400,
          details: error.flatten().fieldErrors,
        },
        400
      )
    }
    
    // Custom API error
    if (error && typeof error === "object" && "statusCode" in error) {
      return c.json(error, error.statusCode as number)
    }
    
    // Unknown error
    return c.json(
      {
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" 
          ? (error as Error).message 
          : "An unexpected error occurred",
        statusCode: 500,
      },
      500
    )
  }
}
```

### Custom Error Classes

```typescript
// ✅ errors/app-errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND")
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR", details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN")
  }
}
```

---

## 4. Middleware

### Authentication Middleware

```typescript
// ✅ middleware/auth.ts
import { MiddlewareHandler } from "hono"

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  
  if (!token) {
    return c.json(
      { error: "Unauthorized", message: "No token provided" },
      401
    )
  }
  
  try {
    const user = await verifyToken(token)
    c.set("user", user)
    await next()
  } catch {
    return c.json(
      { error: "Unauthorized", message: "Invalid token" },
      401
    )
  }
}

// ✅ Optional auth (doesn't fail if no token)
export const optionalAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  
  if (token) {
    try {
      const user = await verifyToken(token)
      c.set("user", user)
    } catch {
      // Ignore invalid token
    }
  }
  
  await next()
}
```

### CORS Middleware

```typescript
// ✅ middleware/cors.ts
import { cors } from "hono/cors"

export const corsMiddleware = cors({
  origin: [
    "http://localhost:1420",  // Vite dev server
    "http://localhost:3000",  // Production
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
})
```

### Rate Limiting

```typescript
// ✅ middleware/rate-limit.ts
import { MiddlewareHandler } from "hono"

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (maxRequests = 100, windowMs = 60000): MiddlewareHandler =>
  async (c, next) => {
    const ip = c.req.header("x-forwarded-for") ?? "unknown"
    const now = Date.now()
    const record = rateLimitMap.get(ip)
    
    if (record && record.resetAt > now) {
      if (record.count >= maxRequests) {
        return c.json(
          { error: "Too Many Requests", message: "Rate limit exceeded" },
          429
        )
      }
      record.count++
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    }
    
    await next()
  }
```

### Logging Middleware

```typescript
// ✅ middleware/logging.ts
import { MiddlewareHandler } from "hono"

export const loggingMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const { method, url } = c.req
  
  await next()
  
  const duration = Date.now() - start
  const status = c.res.status
  
  console.log(
    `[${new Date().toISOString()}] ${method} ${url} ${status} ${duration}ms`
  )
}
```

---

## 5. Response Formatting

### Success Responses

```typescript
// ✅ Standard success responses
interface SuccessResponse<T> {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

// ✅ Paginated response
userRoutes.get("/", async (c) => {
  const { page, limit } = c.req.query()
  const { users, total } = await UserService.findAll({
    page: Number(page),
    limit: Number(limit),
  })
  
  const response: SuccessResponse<User[]> = {
    data: users,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  }
  
  return c.json(response)
})

// ✅ Single resource response
userRoutes.get("/:id", async (c) => {
  const user = await UserService.findById(c.req.param("id"))
  
  if (!user) {
    return c.json(
      { error: "Not Found", message: "User not found" },
      404
    )
  }
  
  return c.json({ data: user })
})

// ✅ Mutation response
userRoutes.post("/", async (c) => {
  const user = await UserService.create(c.req.valid("json"))
  return c.json({ data: user }, 201)
})
```

### Streaming Responses

```typescript
// ✅ SSE for real-time data
userRoutes.get("/stream", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }
      
      // Send initial connection
      send("connected", { timestamp: Date.now() })
      
      // Subscribe to events
      const unsubscribe = eventEmitter.on("update", (data) => {
        send("update", data)
      })
      
      // Cleanup on close
      c.req.raw.signal.addEventListener("abort", () => {
        unsubscribe()
        controller.close()
      })
    },
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
})
```

---

## 6. API Versioning

### URL Versioning

```typescript
// ✅ api/v1/users.ts
const v1Routes = new Hono()
v1Routes.route("/users", userRoutesV1)

// ✅ api/v2/users.ts
const v2Routes = new Hono()
v2Routes.route("/users", userRoutesV2)

// ✅ Main API
const api = new Hono()
api.route("/v1", v1Routes)
api.route("/v2", v2Routes)
```

### Header Versioning

```typescript
// ✅ middleware/version.ts
import { MiddlewareHandler } from "hono"

export const versionMiddleware: MiddlewareHandler = async (c, next) => {
  const acceptVersion = c.req.header("Accept-Version")
  c.set("apiVersion", acceptVersion ?? "v1")
  await next()
}

// Usage in route
userRoutes.get("/", async (c) => {
  const version = c.get("apiVersion")
  
  if (version === "v2") {
    return c.json(await UserService.findAllV2())
  }
  
  return c.json(await UserService.findAllV1())
})
```

---

## 7. OpenAPI/Swagger

### Schema Documentation

```typescript
// ✅ schemas/openapi.ts
export const openApiSchema = {
  openapi: "3.0.0",
  info: {
    title: "Devil AI API",
    version: "1.0.0",
  },
  paths: {
    "/api/users": {
      get: {
        summary: "List users",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                    meta: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
```

### Swagger UI

```typescript
// ✅ middleware/swagger.ts
import { swaggerUI } from "@hono/swagger-ui"

app.get("/docs", swaggerUI({ url: "/api-docs" }))
app.get("/api-docs", (c) => c.json(openApiSchema))
```

---

## 8. Testing

### Unit Tests

```typescript
// ✅ tests/routes/users.test.ts
import { describe, it, expect, beforeEach } from "bun:test"
import { Hono } from "hono"
import { userRoutes } from "../../routes/users"

describe("User Routes", () => {
  let app: Hono
  
  beforeEach(() => {
    app = new Hono()
    app.route("/users", userRoutes)
  })
  
  it("GET /users returns list of users", async () => {
    const res = await app.request("/users")
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.data).toBeArray()
  })
  
  it("GET /users/:id returns user", async () => {
    const res = await app.request("/users/123")
    expect(res.status).toBe(200)
  })
  
  it("POST /users creates user", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
      }),
    })
    
    expect(res.status).toBe(201)
  })
  
  it("POST /users validates input", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",  // Invalid
        email: "not-an-email",  // Invalid
      }),
    })
    
    expect(res.status).toBe(400)
  })
})
```

---

## Best Practices

1. **RESTful naming** — Use nouns for resources (`/users`, `/sessions`), not verbs
2. **HTTP methods** — GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
3. **Status codes** — 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
4. **Validation at edge** — Validate early with Zod schemas
5. **Consistent error format** — Always return `{ error, message, statusCode }`
6. **Pagination** — Use cursor or page-based pagination for lists
7. **Rate limiting** — Protect public endpoints
8. **CORS** — Configure for your frontend origins
9. **Logging** — Log all requests with timing
10. **API versioning** — Version breaking changes (`/v1/`, `/v2/`)
