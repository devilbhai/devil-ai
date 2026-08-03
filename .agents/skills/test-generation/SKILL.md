---
name: test-generation
description: Auto-generate unit tests, mock data patterns, test coverage, test organization, and test automation for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Test Generation Patterns

Auto-generating tests and test patterns for the Devil AI codebase.

## When to Apply

- Writing new tests
- Generating test data
- Increasing test coverage
- Organizing test files
- Automating test creation

---

## 1. Test File Structure

### File Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx          # Co-located tests
├── services/
│   ├── user-service.ts
│   └── user-service.test.ts     # Co-located tests
└── utils/
    ├── format.ts
    └── format.test.ts           # Co-located tests

# OR separate test directory
tests/
├── unit/
│   ├── components/
│   │   └── Button.test.tsx
│   └── services/
│       └── user-service.test.ts
├── integration/
│   └── api.test.ts
└── helpers/
    └── test-utils.ts
```

### Test File Template

```typescript
// ✅ Standard test file structure
import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { functionUnderTest } from "./module"

describe("functionUnderTest", () => {
  // Setup
  beforeEach(() => {
    // Reset state before each test
  })
  
  // Cleanup
  afterEach(() => {
    // Clean up after each test
  })
  
  describe("when condition A", () => {
    it("should do X", () => {
      // Arrange
      const input = "test"
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe("expected")
    })
  })
  
  describe("when condition B", () => {
    it("should do Y", () => {
      // Test implementation
    })
  })
})
```

---

## 2. Test Data Generation

### Mock Data Factory

```typescript
// ✅ test/helpers/factories.ts
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user" | "guest"
  createdAt: Date
}

class UserFactory {
  private counter = 0
  
  build(overrides: Partial<User> = {}): User {
    this.counter++
    
    return {
      id: `user-${this.counter}`,
      name: `User ${this.counter}`,
      email: `user${this.counter}@example.com`,
      role: "user",
      createdAt: new Date(),
      ...overrides,
    }
  }
  
  buildMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.build(overrides))
  }
  
  buildAdmin(): User {
    return this.build({ role: "admin" })
  }
  
  buildGuest(): User {
    return this.build({ role: "guest" })
  }
}

export const userFactory = new UserFactory()
```

### Faker Integration

```typescript
// ✅ test/helpers/faker.ts
import { faker } from "@faker-js/faker"

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement(["admin", "user", "guest"]),
    createdAt: faker.date.recent(),
    ...overrides,
  }
}

export function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  }
}

export function createMockComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    postId: faker.string.uuid(),
    authorId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  }
}
```

### Random Data Generators

```typescript
// ✅ test/helpers/random.ts
export function randomString(length = 10): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

export function randomEmail(): string {
  return `${randomString()}@example.com`
}

export function randomInt(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomBoolean(): boolean {
  return Math.random() > 0.5
}

export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function randomDate(start = new Date(2020, 0, 1), end = new Date()): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
```

---

## 3. Unit Test Generation

### Function Tests

```typescript
// ✅ Auto-generate tests for a function
// Source: utils/format.ts
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

// Test: utils/format.test.ts
import { describe, it, expect } from "bun:test"
import { formatCurrency } from "./format"

describe("formatCurrency", () => {
  it("formats USD currency", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })
  
  it("formats EUR currency", () => {
    expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56")
  })
  
  it("formats zero amount", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })
  
  it("formats negative amount", () => {
    expect(formatCurrency(-1234.56)).toBe("-$1,234.56")
  })
  
  it("formats large amounts", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00")
  })
})
```

### Class Tests

```typescript
// ✅ Auto-generate tests for a class
// Source: services/user-service.ts
export class UserService {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    return this.db.users.findById(id)
  }
  
  async create(data: CreateUserDTO): Promise<User> {
    const user = { id: crypto.randomUUID(), ...data }
    await this.db.users.create(user)
    return user
  }
  
  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.db.users.update(id, data)
  }
  
  async delete(id: string): Promise<boolean> {
    return this.db.users.delete(id)
  }
}

// Test: services/user-service.test.ts
import { describe, it, expect, beforeEach, mock } from "bun:test"
import { UserService } from "./user-service"

describe("UserService", () => {
  let service: UserService
  let mockDb: any
  
  beforeEach(() => {
    mockDb = {
      users: {
        findById: mock(() => Promise.resolve(null)),
        create: mock((user) => Promise.resolve(user)),
        update: mock((id, data) => Promise.resolve({ id, ...data })),
        delete: mock(() => Promise.resolve(true)),
      },
    }
    service = new UserService(mockDb)
  })
  
  describe("findById", () => {
    it("returns user when found", async () => {
      const user = { id: "123", name: "Test" }
      mockDb.users.findById.mockReturnValue(Promise.resolve(user))
      
      const result = await service.findById("123")
      
      expect(result).toEqual(user)
      expect(mockDb.users.findById).toHaveBeenCalledWith("123")
    })
    
    it("returns null when not found", async () => {
      const result = await service.findById("nonexistent")
      
      expect(result).toBeNull()
    })
  })
  
  describe("create", () => {
    it("creates user with generated id", async () => {
      const data = { name: "Test", email: "test@example.com" }
      
      const result = await service.create(data)
      
      expect(result).toHaveProperty("id")
      expect(result.name).toBe("Test")
      expect(mockDb.users.create).toHaveBeenCalled()
    })
  })
  
  describe("update", () => {
    it("updates user", async () => {
      const data = { name: "Updated" }
      
      await service.update("123", data)
      
      expect(mockDb.users.update).toHaveBeenCalledWith("123", data)
    })
  })
  
  describe("delete", () => {
    it("deletes user", async () => {
      const result = await service.delete("123")
      
      expect(result).toBe(true)
      expect(mockDb.users.delete).toHaveBeenCalledWith("123")
    })
  })
})
```

---

## 4. React Component Tests

### Basic Component Test

```typescript
// ✅ Auto-generate tests for React component
// Source: components/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  disabled?: boolean
  onClick?: () => void
}

export function Button({ children, variant = "primary", disabled, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Test: components/Button.test.tsx
import { describe, it, expect, mock } from "bun:test"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "./Button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeDefined()
  })
  
  it("applies primary variant by default", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("btn-primary")
  })
  
  it("applies secondary variant", () => {
    render(<Button variant="secondary">Click me</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("btn-secondary")
  })
  
  it("calls onClick when clicked", () => {
    const onClick = mock(() => {})
    render(<Button onClick={onClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole("button"))
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  
  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
```

### Hook Tests

```typescript
// ✅ Auto-generate tests for custom hook
// Source: hooks/use-counter.ts
import { useState, useCallback } from "react"

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => setCount((c) => c + 1), [])
  const decrement = useCallback(() => setCount((c) => c - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])
  
  return { count, increment, decrement, reset }
}

// Test: hooks/use-counter.test.ts
import { describe, it, expect } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import { useCounter } from "./use-counter"

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })
  
  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })
  
  it("increments count", () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
  
  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5))
    
    act(() => {
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(4)
  })
  
  it("resets to initial value", () => {
    const { result } = renderHook(() => useCounter(10))
    
    act(() => {
      result.current.increment()
      result.current.increment()
    })
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.count).toBe(10)
  })
})
```

---

## 5. API Test Generation

### Endpoint Tests

```typescript
// ✅ Auto-generate API tests
// Source: routes/users.ts
userRoutes.get("/", async (c) => {
  const users = await UserService.findAll()
  return c.json({ data: users })
})

userRoutes.get("/:id", async (c) => {
  const user = await UserService.findById(c.req.param("id"))
  if (!user) return c.json({ error: "Not found" }, 404)
  return c.json({ data: user })
})

// Test: routes/users.test.ts
import { describe, it, expect, beforeEach } from "bun:test"
import { Hono } from "hono"
import { userRoutes } from "./users"

describe("User Routes", () => {
  let app: Hono
  
  beforeEach(() => {
    app = new Hono()
    app.route("/users", userRoutes)
  })
  
  describe("GET /users", () => {
    it("returns list of users", async () => {
      const res = await app.request("/users")
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty("data")
      expect(Array.isArray(data.data)).toBe(true)
    })
  })
  
  describe("GET /users/:id", () => {
    it("returns user when found", async () => {
      const res = await app.request("/users/123")
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty("data")
    })
    
    it("returns 404 when not found", async () => {
      const res = await app.request("/users/nonexistent")
      
      expect(res.status).toBe(404)
    })
  })
})
```

---

## 6. Snapshot Tests

### Component Snapshots

```typescript
// ✅ Snapshot tests for UI components
import { describe, it, expect } from "bun:test"
import { render } from "@testing-library/react"
import { Button } from "./Button"

describe("Button", () => {
  it("matches snapshot", () => {
    const { container } = render(<Button>Click me</Button>)
    expect(container).toMatchSnapshot()
  })
  
  it("matches snapshot with props", () => {
    const { container } = render(
      <Button variant="secondary" disabled>
        Click me
      </Button>
    )
    expect(container).toMatchSnapshot()
  })
})
```

---

## 7. Test Utilities

### Custom Matchers

```typescript
// ✅ test/helpers/matchers.ts
import { expect } from "bun:test"

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? "not " : ""}to be within range ${floor} - ${ceiling}`,
    }
  },
  
  toHaveBeenCalledWithArgs(
    mockFn: mock.Mock,
    ...args: unknown[]
  ) {
    const calls = mockFn.mock.calls
    const found = calls.some(
      (call) => JSON.stringify(call) === JSON.stringify(args)
    )
    return {
      pass: found,
      message: () =>
        `expected mock to have been called with ${JSON.stringify(args)}`,
    }
  },
})

// Usage
expect(5).toBeWithinRange(1, 10)
```

### Test Helpers

```typescript
// ✅ test/helpers/test-utils.ts
import { render, RenderOptions } from "@testing-library/react"
import { ReactElement } from "react"

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => <TestProvider>{children}</TestProvider>,
    ...options,
  })
}

export * from "@testing-library/react"
export { customRender as render }
```

---

## 8. Coverage Configuration

### Coverage Thresholds

```json
// ✅ package.json
{
  "scripts": {
    "test:coverage": "bun test --coverage"
  },
  "bun": {
    "test": {
      "coverage": true,
      "coverageThreshold": {
        "statements": 80,
        "branches": 80,
        "functions": 80,
        "lines": 80
      }
    }
  }
}
```

### Coverage Reports

```bash
# ✅ Generate coverage report
bun test --coverage

# ✅ View HTML report
open coverage/index.html

# ✅ Coverage in CI
bun test --coverage --coverage-reporter=text --coverage-reporter=lcov
```

---

## 9. Test Automation

### Generate Tests Command

```bash
# ✅ Generate test file for a source file
bunx ts-mocha --generate-tests src/**/*.ts

# ✅ Or use custom script
bun run test:generate src/services/user-service.ts
```

### Test Watch Mode

```bash
# ✅ Run tests in watch mode
bun test --watch

# ✅ Run specific test file in watch mode
bun test --watch src/components/Button.test.tsx
```

---

## Best Practices

1. **Co-locate tests** — Keep tests near source files
2. **Use factories** — Generate test data consistently
3. **Test behavior, not implementation** — Black box testing
4. **One assertion per test** — Keep tests focused
5. **Descriptive names** — Tests should read like documentation
6. **Mock external dependencies** — Isolate units
7. **Test edge cases** — Empty, null, boundary values
8. **Use snapshots** — For UI components
9. **Maintain coverage** — Don't let it drop
10. **Automate generation** — Use tools to scaffold tests
