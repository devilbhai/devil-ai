---
name: typescript-patterns
description: TypeScript best practices, type safety patterns, generics, utility types, discriminated unions, and type guards for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# TypeScript Patterns

Comprehensive TypeScript patterns for type-safe code in the Devil AI codebase.

## When to Apply

- Writing new TypeScript files
- Refactoring untyped/loosely typed code
- Creating reusable utility types
- Working with complex data structures
- Integrating with external APIs/SDKs

---

## 1. Type Narrowing & Guards

### Discriminated Unions

Use discriminated unions for state machines and variant types:

```typescript
// ✅ Correct: discriminated union
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error }

function handleState(state: RequestState<User>) {
  switch (state.status) {
    case "idle":
      return <IdleSpinner />
    case "loading":
      return <LoadingBar />
    case "success":
      return <UserCard user={state.data} />
    case "error":
      return <ErrorMessage error={state.error} />
  }
}
```

### Type Guards

```typescript
// ✅ Custom type guard
function isErrorResponse(
  response: ApiResponse
): response is ErrorResponse {
  return "error" in response
}

// Usage
const result = await apiCall()
if (isErrorResponse(result)) {
  console.error(result.error)
} else {
  console.log(result.data)
}
```

### Never Type for Exhaustiveness

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}

type Theme = "light" | "dark" | "system"

function getThemeColor(theme: Theme): string {
  switch (theme) {
    case "light":
      return "#ffffff"
    case "dark":
      return "#000000"
    case "system":
      return "#cccccc"
    default:
      return assertNever(theme)
  }
}
```

---

## 2. Utility Types

### Partial with Required

```typescript
// ✅ All optional, but some required when updating
type UpdateUserDTO = Partial<User> & Required<Pick<User, "id">>

function updateUser(dto: UpdateUserDTO) {
  const { id, ...fields } = dto
  // id is guaranteed to exist
}
```

### Pick & Omit for API Contracts

```typescript
// ✅ API response excludes sensitive fields
type UserResponse = Omit<User, "password" | "salt">

// ✅ Create DTO omits auto-generated fields
type CreateUserDTO = Omit<User, "id" | "createdAt" | "updatedAt">
```

### Record for Mapped Types

```typescript
// ✅ Type-safe permission map
type Permissions = Record<Role, readonly Permission[]>

const ROLE_PERMISSIONS: Permissions = {
  admin: ["read", "write", "delete"],
  user: ["read"],
  guest: ["read"],
}
```

---

## 3. Generics

### Generic Constraints

```typescript
// ✅ Constrain to objects with 'id' field
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find((item) => item.id === id)
}

// Usage
const user = findById(users, "123") // ✅ Type-safe
const post = findById(posts, "456") // ✅ Works for any type with id
```

### Mapped Types with Generics

```typescript
// ✅ Create getter/setter pairs automatically
type Accessors<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void
}

interface User {
  name: string
  age: number
}

// Results in:
// {
//   getName: () => string
//   getAge: () => number
//   setName: (value: string) => void
//   setAge: (value: number) => void
// }
```

---

## 4. Template Literal Types

```typescript
// ✅ Type-safe event names
type EventName<T extends string> = `on${Capitalize<T>}`

type ButtonEvents = EventName<"click" | "hover" | "focus">
// Results in: "onClick" | "onHover" | "onFocus"

// ✅ Type-safe CSS class names
type TailwindClass<T extends string> = `${T}-${"sm" | "md" | "lg" | "xl"}`

type ResponsiveWidth = TailwindClass<"w">
// Results in: "w-sm" | "w-md" | "w/lg" | "w-xl"
```

---

## 5. Const Assertions & Satisfies

### Const Assertions

```typescript
// ✅ Infer literal types instead of string
const ROUTES = {
  home: "/",
  about: "/about",
  chat: "/chat",
} as const

type Route = (typeof ROUTES)[keyof typeof ROUTES]
// Results in: "/" | "/about" | "/chat"
```

### Satisfies Operator

```typescript
// ✅ Validate shape while preserving literal types
const config = {
  port: 3000,
  host: "localhost",
  debug: true,
} satisfies Record<string, string | number | boolean>

// config.port is inferred as 3000, not number
```

---

## 6. Conditional Types

```typescript
// ✅ Extract response type based on endpoint
type ApiResponse<T extends string> =
  T extends "/users" ? User[]
  : T extends "/users/:id" ? User
  : T extends "/posts" ? Post[]
  : never

function fetchData<T extends string>(endpoint: T): Promise<ApiResponse<T>> {
  // Implementation
}

// Usage - type is automatically inferred
const users = await fetchData("/users") // User[]
const user = await fetchData("/users/:id") // User
```

---

## 7. Infer Keyword

```typescript
// ✅ Extract function parameters
type Params = Parameters<typeof fetchUser>
// Results in: [id: string, options?: RequestOptions]

// ✅ Extract return type
type Return = ReturnType<typeof fetchUser>
// Results in: Promise<User>

// ✅ Extract array element type
type Element = Awaited<Promise<User[]>>
// Results in: User[]
```

---

## 8. Type-Safe Event Emitters

```typescript
// ✅ Type-safe event emitter
type EventMap = {
  "user:login": { userId: string; timestamp: number }
  "user:logout": { userId: string }
  "message:new": { content: string; author: string }
}

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<string, Set<Function>>()

  on<K extends keyof Events>(
    event: K,
    handler: (payload: Events[K]) => void
  ): () => void {
    if (!this.handlers.has(event as string)) {
      this.handlers.set(event as string, new Set())
    }
    this.handlers.get(event as string)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event as string)?.delete(handler)
    }
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event as string)?.forEach((handler) => handler(payload))
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>()

emitter.on("user:login", ({ userId, timestamp }) => {
  // ✅ TypeScript knows the payload shape
})

emitter.emit("user:login", { userId: "123", timestamp: Date.now() }) // ✅
emitter.emit("user:login", { userId: "123" }) // ❌ Missing timestamp
```

---

## 9. Branded Types

```typescript
// ✅ Prevent mixing up similar types
type UserId = string & { readonly __brand: unique symbol }
type PostId = string & { readonly __brand: unique symbol }

function createUserId(id: string): UserId {
  return id as UserId
}

function createPostId(id: string): PostId {
  return id as PostId
}

function fetchUser(id: UserId): Promise<User> {
  // Implementation
}

const userId = createUserId("123")
const postId = createPostId("456")

fetchUser(userId) // ✅
fetchUser(postId) // ❌ Type error - prevents bugs
```

---

## 10. Zod Integration

```typescript
// ✅ Runtime validation with type inference
import { z } from "zod"

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.date(),
})

type User = z.infer<typeof UserSchema>

// ✅ Validate API responses
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  return UserSchema.parse(data) // Throws if invalid
}

// ✅ Safe validation
const result = UserSchema.safeParse(data)
if (result.success) {
  console.log(result.data) // Type: User
} else {
  console.error(result.error)
}
```

---

## Best Practices

1. **Prefer `interface` for object shapes** — Better error messages and extensible
2. **Use `type` for unions and aliases** — More flexible for complex types
3. **Import types with `import type`** — Avoids circular dependencies
4. **Use `satisfies` over type assertion** — Validates while preserving inference
5. **Leverage `never` for exhaustiveness** — Catch missing cases at compile time
6. **Use branded types for IDs** — Prevents mixing up similar primitive types
7. **Infer types from Zod schemas** — Single source of truth for runtime and compile-time
