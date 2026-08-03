---
name: refactoring-patterns
description: Code refactoring patterns, code smells detection, extract method, move method, rename patterns, and clean code practices for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Refactoring Patterns

Code refactoring patterns and clean code practices for the Devil AI codebase.

## When to Apply

- Cleaning up messy code
- Reducing code duplication
- Improving code readability
- Detecting code smells
- Restructuring existing code

---

## 1. Code Smells

### Long Function

```typescript
// ❌ Code Smell: Function too long
async function processUser(data: any) {
  // 50+ lines of code...
  // validation, transformation, database call, email sending...
}

// ✅ Refactored: Extract smaller functions
async function processUser(data: CreateUserDTO) {
  const validatedData = validateUserData(data)
  const user = await createUser(validatedData)
  await sendWelcomeEmail(user)
  return user
}
```

### Duplicated Code

```typescript
// ❌ Code Smell: Duplicated logic
function calculateDiscount(price: number, vip: boolean) {
  if (vip) return price * 0.8
  return price
}

function calculateTax(price: number, vip: boolean) {
  if (vip) return price * 0.1
  return price * 0.2
}

// ✅ Refactored: Extract common logic
function isVip(vip: boolean): number {
  return vip ? 0.8 : 1
}

function calculateDiscount(price: number, vip: boolean) {
  return price * isVip(vip) * 0.2
}

function calculateTax(price: number, vip: boolean) {
  return price * isVip(vip) * 0.15
}
```

### Large Class

```typescript
// ❌ Code Smell: Class doing too much
class UserManager {
  createUser() {}
  deleteUser() {}
  sendEmail() {}
  generateReport() {}
  handlePayment() {}
}

// ✅ Refactored: Single Responsibility
class UserService {
  createUser() {}
  deleteUser() {}
}

class EmailService {
  sendEmail() {}
}

class ReportService {
  generateReport() {}
}
```

### Primitive Obsession

```typescript
// ❌ Code Smell: Primitives instead of objects
function createOrder(
  userId: string,
  productName: string,
  quantity: number,
  price: number
) {}

// ✅ Refactored: Use objects
interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

function createOrder(userId: string, items: OrderItem[]) {}
```

---

## 2. Extract Patterns

### Extract Function

```typescript
// ❌ Before
function processOrder(order: Order) {
  // Calculate total
  let total = 0
  for (const item of order.items) {
    total += item.price * item.quantity
  }
  
  // Apply discount
  if (order.coupon) {
    total = total * 0.9
  }
  
  // Add tax
  total = total * 1.1
  
  // Save to database
  db.orders.insert({ ...order, total })
}

// ✅ After: Extract functions
function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function applyDiscount(total: number, coupon?: string): number {
  return coupon ? total * 0.9 : total
}

function applyTax(total: number): number {
  return total * 1.1
}

function processOrder(order: Order) {
  const subtotal = calculateSubtotal(order.items)
  const afterDiscount = applyDiscount(subtotal, order.coupon)
  const total = applyTax(afterDiscount)
  
  db.orders.insert({ ...order, total })
}
```

### Extract Class

```typescript
// ❌ Before
class User {
  name: string
  email: string
  
  validateEmail() {}
  sendWelcomeEmail() {}
  generateReport() {}
}

// ✅ After: Extract classes
class User {
  name: string
  email: string
}

class EmailService {
  sendWelcomeEmail(user: User) {}
  validateEmail(email: string) {}
}

class ReportService {
  generateUserReport(user: User) {}
}
```

### Extract Interface

```typescript
// ❌ Before
function processPayment(card: { number: string; cvv: string; expiry: string }) {}

// ✅ After: Extract interface
interface CreditCard {
  number: string
  cvv: string
  expiry: string
}

function processPayment(card: CreditCard) {}
```

---

## 3. Move Patterns

### Move Function

```typescript
// ❌ Before: Function in wrong class
class Order {
  calculateTax() {} // Tax logic belongs in TaxService
}

// ✅ After: Move to correct class
class TaxService {
  calculateTax(order: Order) {}
}

class Order {
  get totalWithTax() {
    return TaxService.calculateTax(this)
  }
}
```

### Move Field

```typescript
// ❌ Before: Field in wrong class
class User {
  name: string
  shippingAddress: string // Should be in Order
}

// ✅ After: Move to correct class
class User {
  name: string
}

class Order {
  shippingAddress: string
}
```

---

## 4. Rename Patterns

### Rename Variable

```typescript
// ❌ Before: Unclear name
const x = getData()

// ✅ After: Descriptive name
const userData = fetchUserData()
```

### Rename Function

```typescript
// ❌ Before: Unclear purpose
function process() {}

// ✅ After: Clear purpose
function processPayment() {}
function validateUserInput() {}
```

### Rename Class

```typescript
// ❌ Before: Generic name
class Manager {
  handleUser() {}
  handleOrder() {}
}

// ✅ After: Specific names
class UserService {
  createUser() {}
  deleteUser() {}
}

class OrderService {
  processOrder() {}
  cancelOrder() {}
}
```

---

## 5. Simplification Patterns

### Replace Conditional with Polymorphism

```typescript
// ❌ Before: Switch statement
function getDiscount(type: string): number {
  switch (type) {
    case "regular": return 0
    case "vip": return 0.2
    case "premium": return 0.3
  }
}

// ✅ After: Use objects/polymorphism
const discounts = {
  regular: 0,
  vip: 0.2,
  premium: 0.3,
} as const

function getDiscount(type: keyof typeof discounts): number {
  return discounts[type]
}
```

### Replace Magic Numbers

```typescript
// ❌ Before: Magic number
if (user.age > 18) {}

// ✅ After: Named constant
const LEGAL_AGE = 18
if (user.age > LEGAL_AGE) {}
```

### Decompose Conditional

```typescript
// ❌ Before: Complex condition
if (user.age > 18 && user.hasInsurance && !user.isBlacklisted) {}

// ✅ After: Named functions
function isEligibleForCoverage(user: User): boolean {
  return (
    isAdult(user.age) &&
    hasValidInsurance(user) &&
    !isBlacklisted(user)
  )
}

if (isEligibleForCoverage(user)) {}
```

---

## 6. Performance Refactoring

### Replace Loop with Array Methods

```typescript
// ❌ Before: Manual loop
const results = []
for (const item of items) {
  if (item.active) {
    results.push(item.name)
  }
}

// ✅ After: Array methods
const results = items
  .filter(item => item.active)
  .map(item => item.name)
```

### Cache Computed Values

```typescript
// ❌ Before: Recompute on every access
get fullName() {
  return `${this.firstName} ${this.lastName}`
}

// ✅ After: Cache value
private _fullName?: string

get fullName() {
  if (!this._fullName) {
    this._fullName = `${this.firstName} ${this.lastName}`
  }
  return this._fullName
}
```

---

## 7. TypeScript Refactoring

### Use Discriminated Unions

```typescript
// ❌ Before: Type assertions
type Result = { data: any } | { error: any }

// ✅ After: Discriminated union
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error }
```

### Use Utility Types

```typescript
// ❌ Before: Manual types
interface CreateUserDTO {
  name: string
  email: string
  password: string
}

interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
}

// ✅ After: Utility types
interface CreateUserDTO {
  name: string
  email: string
  password: string
}

type UpdateUserDTO = Partial<CreateUserDTO>
```

---

## 8. React Refactoring

### Extract Custom Hooks

```typescript
// ❌ Before: Logic in component
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false))
  }, [userId])
  
  // ...
}

// ✅ After: Extract hook
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false))
  }, [userId])
  
  return { user, loading }
}

function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId)
  // ...
}
```

### Memoize Expensive Computations

```typescript
// ❌ Before: Recompute on every render
function SortedList({ items, sortBy }: Props) {
  const sorted = [...items].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    return b.createdAt - a.createdAt
  })
  
  return <div>{sorted.map(renderItem)}</div>
}

// ✅ After: Memoize
function SortedList({ items, sortBy }: Props) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return b.createdAt - a.createdAt
    })
  }, [items, sortBy])
  
  return <div>{sorted.map(renderItem)}</div>
}
```

---

## 9. Refactoring Checklist

### Before Refactoring

- [ ] Understand current behavior
- [ ] Write tests for existing behavior
- [ ] Create small, incremental commits
- [ ] Keep application running

### During Refactoring

- [ ] One change at a time
- [ ] Run tests after each change
- [ ] Use IDE refactoring tools
- [ ] Don't mix refactoring with features

### After Refactoring

- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] Documentation updated
- [ ] Performance not degraded

---

## Best Practices

1. **Small steps** — Refactor incrementally, not big bang
2. **Tests first** — Ensure tests pass before and after
3. **Use IDE tools** — Let IDE handle renames, moves, extracts
4. **Commit often** — Easy to revert if needed
5. **Don't mix** — Don't add features while refactoring
6. **Readability** — Code should read like prose
7. **DRY** — Don't Repeat Yourself
8. **Single Responsibility** — One class/function, one purpose
9. **KISS** — Keep It Simple, Stupid
10. **Boy Scout Rule** — Leave code better than you found it
