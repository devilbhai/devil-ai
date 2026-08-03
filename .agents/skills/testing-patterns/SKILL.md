---
name: testing-patterns
description: Testing patterns with Bun test runner, mocking, assertions, test organization, and best practices for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Testing Patterns

Testing patterns for the Devil AI codebase using Bun's built-in test runner.

## When to Apply

- Writing unit tests
- Writing integration tests
- Setting up test utilities
- Mocking dependencies
- Organizing test files

---

## 1. Test Setup

### File Structure

```
packages/configconv/
├── src/
│   ├── converter.ts
│   └── parser.ts
├── test/
│   ├── converter/
│   │   ├── converter.test.ts
│   │   └── parser.test.ts
│   └── helpers/
│       └── test-utils.ts
└── bunfig.toml
```

### bunfig.toml

```toml
[test]
# Preload files
preload = ["./test/helpers/setup.ts"]

# Coverage
coverage = true
coverageDir = "./coverage"
coverageReporter = ["text", "lcov"]

# Reporter
reporter = "default"
```

---

## 2. Basic Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test"

describe("Calculator", () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state if needed
  })
  
  // Cleanup after each test
  afterEach(() => {
    // Clean up resources
  })
  
  describe("add", () => {
    it("adds two positive numbers", () => {
      expect(add(2, 3)).toBe(5)
    })
    
    it("adds negative numbers", () => {
      expect(add(-1, -2)).toBe(-3)
    })
    
    it("handles zero", () => {
      expect(add(5, 0)).toBe(5)
    })
  })
  
  describe("subtract", () => {
    it("subtracts two numbers", () => {
      expect(subtract(5, 3)).toBe(2)
    })
  })
})
```

### Test Organization

```typescript
// ✅ Group related tests
describe("UserService", () => {
  describe("createUser", () => {
    it("creates user with valid data", () => {})
    it("throws on invalid email", () => {})
    it("hashes password", () => {})
  })
  
  describe("findUser", () => {
    it("returns user by id", () => {})
    it("returns null for non-existent user", () => {})
  })
})
```

---

## 3. Assertions

### Value Assertions

```typescript
import { expect } from "bun:test"

// Equality
expect(value).toBe(expected)        // Strict equality (===)
expect(value).toEqual(expected)     // Deep equality
expect(value).not.toBe(expected)    // Negation

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(value).toBeGreaterThan(5)
expect(value).toBeGreaterThanOrEqual(5)
expect(value).toBeLessThan(5)
expect(value).toBeLessThanOrEqual(5)
expect(value).toBeCloseTo(3.14, 2)  // 2 decimal places

// Strings
expect(value).toContain("hello")
expect(value).toMatch(/regex/)

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(array).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(object).toHaveProperty("key")
expect(object).toHaveProperty("key", "value")
expect(object).toMatchObject({ key: "value" })

// Errors
expect(() => fn()).toThrow()
expect(() => fn()).toThrow("error message")
expect(() => fn()).toThrow(Error)
```

### Type Assertions

```typescript
// Type checking
expect(value).toBeInstanceOf(Type)
expect(typeof value).toBe("string")
```

### Snapshot Testing

```typescript
// Component snapshots
expect(component).toMatchSnapshot()

// Inline snapshots
expect(value).toMatchInlineSnapshot(`
  {
    "name": "test",
    "value": 123
  }
`)

// Update snapshots
bun test --update-snapshots
```

---

## 4. Mocking

### Function Mocks

```typescript
import { mock, jest } from "bun:test"

// Create mock function
const mockFn = mock(() => {})

// Mock with return value
const mockFn = mock(() => "mocked value")

// Mock with implementation
const mockFn = mock((x: number) => x * 2)

// Call assertions
mockFn("arg1", "arg2")

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(1)
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2")
expect(mockFn).toHaveBeenLastCalledWith("arg1", "arg2")
```

### Module Mocks

```typescript
// Mock entire module
import { mock } from "bun:test"

// mock.module() is not available in Bun
// Use dependency injection or manual mocking instead

// ✅ Manual mock approach
const mockUserService = {
  findById: mock(() => Promise.resolve({ id: "1", name: "Test" })),
  create: mock((data) => Promise.resolve({ id: "2", ...data })),
}

// Inject mock
const service = new UserService(mockUserService)
```

### Spy on Methods

```typescript
import { spy, mock } from "bun:test"

// Spy on object method
const obj = {
  method: () => "original",
}

const spy = spy(obj, "method")

obj.method()

expect(spy).toHaveBeenCalled()
expect(spy).toHaveReturnedWith("original")

// Restore
spy.mockRestore()
```

---

## 5. Async Tests

### Promises

```typescript
import { describe, it, expect } from "bun:test"

describe("async operations", () => {
  it("resolves with correct value", async () => {
    const result = await asyncFunction()
    expect(result).toBe("expected")
  })
  
  it("rejects with error", async () => {
    await expect(failingFunction()).rejects.toThrow("error message")
  })
})
```

### Timers

```typescript
import { describe, it, expect, mock } from "bun:test"

describe("timer operations", () => {
  it("calls function after delay", async () => {
    const fn = mock(() => {})
    
    setTimeout(fn, 1000)
    
    await Bun.sleep(1100)
    expect(fn).toHaveBeenCalled()
  })
  
  it("debounced function", async () => {
    const fn = mock(() => {})
    const debounced = debounce(fn, 300)
    
    debounced()
    debounced()
    debounced()
    
    await Bun.sleep(400)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
```

---

## 6. Integration Tests

### API Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"

describe("API Routes", () => {
  let app: Hono
  
  beforeAll(() => {
    app = new Hono()
    // Setup routes
  })
  
  afterAll(async () => {
    // Cleanup
  })
  
  it("GET /api/users returns users", async () => {
    const res = await app.request("/api/users")
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data).toHaveProperty("data")
    expect(Array.isArray(data.data)).toBe(true)
  })
  
  it("POST /api/users creates user", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
      }),
    })
    
    expect(res.status).toBe(201)
    
    const data = await res.json()
    expect(data.data).toHaveProperty("id")
    expect(data.data.name).toBe("Test User")
  })
})
```

### Database Testing

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test"
import { db } from "../src/db"

describe("UserRepository", () => {
  beforeAll(async () => {
    // Setup test database
    await db.migrate()
  })
  
  afterAll(async () => {
    // Cleanup
    await db.destroy()
  })
  
  beforeEach(async () => {
    // Reset data between tests
    await db.truncate()
  })
  
  it("creates user", async () => {
    const user = await UserRepository.create({
      name: "Test",
      email: "test@example.com",
    })
    
    expect(user).toHaveProperty("id")
    expect(user.name).toBe("Test")
  })
  
  it("finds user by id", async () => {
    const created = await UserRepository.create({
      name: "Test",
      email: "test@example.com",
    })
    
    const found = await UserRepository.findById(created.id)
    expect(found).toEqual(created)
  })
})
```

---

## 7. Test Utilities

### Custom Matchers

```typescript
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
})

// Usage
expect(value).toBeWithinRange(1, 10)
```

### Test Helpers

```typescript
// test/helpers/test-utils.ts
import { mock } from "bun:test"

// Create mock user
export const createMockUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "user",
  createdAt: new Date(),
  ...overrides,
})

// Create mock message
export const createMockMessage = (overrides = {}) => ({
  id: "msg-1",
  content: "Hello world",
  role: "user" as const,
  authorId: "user-1",
  timestamp: Date.now(),
  ...overrides,
})

// Wait for async operations
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Flush promises
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve))
```

### Factory Functions

```typescript
// test/factories/user.factory.ts
import { createMockUser } from "../helpers/test-utils"

let userCounter = 0

export const UserFactory = {
  build: (overrides = {}) => {
    userCounter++
    return createMockUser({
      id: `user-${userCounter}`,
      name: `User ${userCounter}`,
      email: `user${userCounter}@example.com`,
      ...overrides,
    })
  },
  
  buildMany: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => UserFactory.build(overrides))
  },
}
```

---

## 8. Component Testing

### React Component Tests

```typescript
import { describe, it, expect } from "bun:test"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "../src/components/Button"

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeDefined()
  })
  
  it("calls onClick when clicked", () => {
    const onClick = mock(() => {})
    render(<Button onClick={onClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText("Click me"))
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  
  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText("Click me")).toBeDisabled()
  })
})
```

### Hook Testing

```typescript
import { describe, it, expect } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import { useCounter } from "../src/hooks/useCounter"

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter(0))
    expect(result.current.count).toBe(0)
  })
  
  it("increments count", () => {
    const { result } = renderHook(() => useCounter(0))
    
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
})
```

---

## 9. Coverage

### Coverage Configuration

```toml
# bunfig.toml
[test]
coverage = true
coverageDir = "./coverage"
coverageReporter = ["text", "lcov", "json"]
```

### Coverage Reports

```bash
# Run tests with coverage
bun test --coverage

# View coverage report
open coverage/index.html

# Coverage thresholds
bun test --coverage --coverage-reporter=text --coverage-reporter=lcov
```

### Coverage Assertions

```typescript
// Enforce coverage thresholds
// package.json
{
  "scripts": {
    "test:coverage": "bun test --coverage"
  },
  "bun": {
    "coverage": {
      "thresholds": {
        "lines": 80,
        "functions": 80,
        "branches": 80,
        "statements": 80
      }
    }
  }
}
```

---

## 10. Best Practices

1. **Test behavior, not implementation** — Test what it does, not how
2. **One assertion per test** — Keep tests focused
3. **Descriptive test names** — Should read like documentation
4. **Use `describe` blocks** — Group related tests
5. **Setup and teardown** — Use `beforeEach`/`afterEach`
6. **Mock external dependencies** — Don't call real APIs
7. **Test edge cases** — Empty inputs, errors, boundaries
8. **Keep tests fast** — Slow tests won't be run
9. **Isolate tests** — No shared state between tests
10. **Test error paths** — Not just happy paths

---

## Commands

```bash
# Run all tests
bun test

# Run specific file
bun test test/converter.test.ts

# Run tests matching pattern
bun test --grep "adds two numbers"

# Run with coverage
bun test --coverage

# Update snapshots
bun test --update-snapshots

# Run tests in watch mode (not native, use watch command)
bun test
```
