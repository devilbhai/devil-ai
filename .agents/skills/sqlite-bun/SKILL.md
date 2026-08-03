---
name: sqlite-bun
description: SQLite database patterns with Bun driver, queries, migrations, schema design, and best practices for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# SQLite Bun Patterns

SQLite database patterns using Bun's built-in driver for the Devil AI codebase.

## When to Apply

- Designing database schemas
- Writing database queries
- Creating migrations
- Implementing data access layers
- Optimizing database performance

---

## 1. Setup & Configuration

### Database Connection

```typescript
// ✅ db/index.ts
import { Database } from "bun:sqlite"

let db: Database | null = null

export function getDb(): Database {
  if (!db) {
    db = new Database("devil-ai.db", {
      create: true,
      readwrite: true,
    })
    
    // Enable WAL mode for better performance
    db.exec("PRAGMA journal_mode = WAL")
    db.exec("PRAGMA foreign_keys = ON")
  }
  
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
```

### Connection Pool (for server)

```typescript
// ✅ db/pool.ts
import { Database } from "bun:sqlite"

class DatabasePool {
  private databases: Database[] = []
  private available: Database[] = []
  private maxSize: number
  
  constructor(maxSize = 5) {
    this.maxSize = maxSize
  }
  
  acquire(): Database {
    if (this.available.length > 0) {
      return this.available.pop()!
    }
    
    if (this.databases.length < this.maxSize) {
      const db = new Database("devil-ai.db")
      db.exec("PRAGMA journal_mode = WAL")
      db.exec("PRAGMA foreign_keys = ON")
      this.databases.push(db)
      return db
    }
    
    throw new Error("No available database connections")
  }
  
  release(db: Database): void {
    this.available.push(db)
  }
  
  close(): void {
    for (const db of this.databases) {
      db.close()
    }
    this.databases = []
    this.available = []
  }
}

export const pool = new DatabasePool()
```

---

## 2. Schema Design

### Table Creation

```typescript
// ✅ db/schema.ts
import { getDb } from "./index"

export function initializeSchema(): void {
  const db = getDb()
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      model TEXT,
      temperature REAL DEFAULT 0.7,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `)
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
  `)
}
```

### Data Types

```sql
-- ✅ SQLite data types
-- Text: TEXT, VARCHAR(n)
-- Numbers: INTEGER, REAL
-- Dates: TEXT (ISO 8601) or INTEGER (Unix timestamp)
-- Boolean: INTEGER (0 or 1)
-- JSON: TEXT (store as JSON string)

-- ✅ Recommended approach
CREATE TABLE examples (
  id TEXT PRIMARY KEY,              -- UUID as text
  name TEXT NOT NULL,               -- String
  count INTEGER DEFAULT 0,          -- Integer
  price REAL DEFAULT 0.0,           -- Float
  is_active INTEGER DEFAULT 1,      -- Boolean
  metadata TEXT,                    -- JSON as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- ISO 8601
);
```

---

## 3. CRUD Operations

### Create

```typescript
// ✅ db/repositories/user.repository.ts
import { getDb } from "../index"
import { CreateUserDTO, User } from "../types"

export class UserRepository {
  static create(data: CreateUserDTO): User {
    const db = getDb()
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, role)
      VALUES (?, ?, ?, ?)
    `)
    
    const id = crypto.randomUUID()
    stmt.run(id, data.email, data.name, data.role ?? "user")
    
    return this.findById(id)!
  }
  
  static createMany(users: CreateUserDTO[]): User[] {
    const db = getDb()
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, role)
      VALUES (?, ?, ?, ?)
    `)
    
    const results = db.transaction((users) => {
      return users.map((user) => {
        const id = crypto.randomUUID()
        stmt.run(id, user.email, user.name, user.role ?? "user")
        return this.findById(id)!
      })
    })
    
    return results(users)
  }
}
```

### Read

```typescript
export class UserRepository {
  static findById(id: string): User | null {
    const db = getDb()
    
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?")
    return stmt.get(id) as User | null
  }
  
  static findByEmail(email: string): User | null {
    const db = getDb()
    
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?")
    return stmt.get(email) as User | null
  }
  
  static findAll(options: { page?: number; limit?: number } = {}): {
    data: User[]
    total: number
  } {
    const db = getDb()
    const { page = 1, limit = 20 } = options
    const offset = (page - 1) * limit
    
    const data = db
      .prepare("SELECT * FROM users LIMIT ? OFFSET ?")
      .all(limit, offset) as User[]
    
    const { total } = db
      .prepare("SELECT COUNT(*) as total FROM users")
      .get() as { total: number }
    
    return { data, total }
  }
  
  static search(query: string): User[] {
    const db = getDb()
    
    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY name
    `)
    
    const searchTerm = `%${query}%`
    return stmt.all(searchTerm, searchTerm) as User[]
  }
}
```

### Update

```typescript
export class UserRepository {
  static update(id: string, data: Partial<CreateUserDTO>): User | null {
    const db = getDb()
    
    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)
    
    const setClause = fields.map((f) => `${f} = ?`).join(", ")
    const values = Object.values(data)
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(...values, id)
    
    return this.findById(id)
  }
  
  static upsert(data: CreateUserDTO): User {
    const existing = this.findByEmail(data.email)
    
    if (existing) {
      return this.update(existing.id, data)!
    }
    
    return this.create(data)
  }
}
```

### Delete

```typescript
export class UserRepository {
  static delete(id: string): boolean {
    const db = getDb()
    
    const stmt = db.prepare("DELETE FROM users WHERE id = ?")
    const result = stmt.run(id)
    
    return result.changes > 0
  }
  
  static deleteMany(ids: string[]): number {
    const db = getDb()
    
    const stmt = db.prepare("DELETE FROM users WHERE id = ?")
    
    const result = db.transaction((ids) => {
      let deleted = 0
      for (const id of ids) {
        const r = stmt.run(id)
        deleted += r.changes
      }
      return deleted
    })
    
    return result(ids)
  }
  
  static softDelete(id: string): boolean {
    const db = getDb()
    
    const stmt = db.prepare(`
      UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    
    const result = stmt.run(id)
    return result.changes > 0
  }
}
```

---

## 4. Transactions

### Basic Transactions

```typescript
// ✅ Transaction example
export function transferFunds(
  fromId: string,
  toId: string,
  amount: number
): void {
  const db = getDb()
  
  db.transaction(() => {
    // Deduct from sender
    db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?")
      .run(amount, fromId)
    
    // Add to receiver
    db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?")
      .run(amount, toId)
    
    // Log transaction
    db.prepare(
      "INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)"
    ).run(fromId, toId, amount)
  })()
}
```

### Nested Transactions

```typescript
// ✅ Nested transaction (savepoints)
export function complexOperation(): void {
  const db = getDb()
  
  db.transaction(() => {
    // Outer transaction
    
    db.prepare("INSERT INTO logs (message) VALUES (?)").run("Step 1")
    
    // Inner savepoint
    db.savepoint(() => {
      db.prepare("INSERT INTO logs (message) VALUES (?)").run("Step 2")
      
      // This will rollback to savepoint if error
      db.prepare("INSERT INTO logs (message) VALUES (?)").run("Step 3")
    })
    
    db.prepare("INSERT INTO logs (message) VALUES (?)").run("Step 4")
  })()
}
```

---

## 5. Prepared Statements

### Caching Prepared Statements

```typescript
// ✅ Cache prepared statements for reuse
const statements = new Map<string, ReturnType<typeof getDb().prepare>>()

function getStatement(sql: string) {
  if (!statements.has(sql)) {
    statements.set(sql, getDb().prepare(sql))
  }
  return statements.get(sql)!
}

// Usage
export function findUser(id: string) {
  const stmt = getStatement("SELECT * FROM users WHERE id = ?")
  return stmt.get(id)
}
```

### Statement with Parameters

```typescript
// ✅ Typed prepared statements
interface UserRow {
  id: string
  email: string
  name: string
  role: string
}

export function createUser(data: CreateUserDTO): UserRow {
  const db = getDb()
  
  const stmt = db.prepare<UserRow, [string, string, string, string]>(`
    INSERT INTO users (id, email, name, role)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `)
  
  const id = crypto.randomUUID()
  return stmt.get(id, data.email, data.name, data.role ?? "user")!
}
```

---

## 6. Migrations

### Migration Structure

```
db/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_sessions.sql
│   └── 003_add_user_avatar.sql
├── migrate.ts
└── index.ts
```

### Migration Runner

```typescript
// ✅ db/migrate.ts
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { getDb } from "./index"

interface Migration {
  id: string
  name: string
  executed_at: string
}

export async function migrate(): Promise<void> {
  const db = getDb()
  
  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Get executed migrations
  const executed = db
    .prepare("SELECT name FROM migrations")
    .all() as Migration[]
  const executedNames = new Set(executed.map((m) => m.name))
  
  // Read migration files
  const migrationsDir = join(import.meta.dir, "migrations")
  const files = await readdir(migrationsDir)
  const sqlFiles = files
    .filter((f) => f.endsWith(".sql"))
    .sort()
  
  // Execute pending migrations
  for (const file of sqlFiles) {
    if (executedNames.has(file)) continue
    
    console.log(`Running migration: ${file}`)
    
    const sql = await Bun.file(join(migrationsDir, file)).text()
    
    db.transaction(() => {
      db.exec(sql)
      db.prepare("INSERT INTO migrations (name) VALUES (?)").run(file)
    })()
    
    console.log(`Completed: ${file}`)
  }
  
  console.log("All migrations completed")
}
```

### Migration Files

```sql
-- ✅ 001_create_users.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

```sql
-- ✅ 002_create_sessions.sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  model TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 7. Query Building

### Dynamic Queries

```typescript
// ✅ Query builder
interface QueryOptions {
  where?: Record<string, unknown>
  orderBy?: string
  limit?: number
  offset?: number
}

function buildQuery(table: string, options: QueryOptions) {
  const conditions: string[] = []
  const values: unknown[] = []
  
  if (options.where) {
    for (const [key, value] of Object.entries(options.where)) {
      if (value === null) {
        conditions.push(`${key} IS NULL`)
      } else if (typeof value === "string" && value.includes("%")) {
        conditions.push(`${key} LIKE ?`)
      } else {
        conditions.push(`${key} = ?`)
      }
      values.push(value)
    }
  }
  
  let sql = `SELECT * FROM ${table}`
  
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`
  }
  
  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy}`
  }
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`
  }
  
  if (options.offset) {
    sql += ` OFFSET ${options.offset}`
  }
  
  return { sql, values }
}

// Usage
const { sql, values } = buildQuery("users", {
  where: { role: "admin", email: "%@example.com" },
  orderBy: "name ASC",
  limit: 10,
})

const users = getDb().prepare(sql).all(...values)
```

### Aggregations

```typescript
// ✅ Aggregation queries
export function getUserStats() {
  const db = getDb()
  
  return db.prepare(`
    SELECT 
      role,
      COUNT(*) as count,
      MIN(created_at) as earliest,
      MAX(created_at) as latest
    FROM users
    GROUP BY role
    HAVING count > 0
    ORDER BY count DESC
  `).all()
}

// ✅ Join aggregation
export function getSessionStats(userId: string) {
  const db = getDb()
  
  return db.prepare(`
    SELECT 
      u.name as user_name,
      COUNT(s.id) as session_count,
      COUNT(m.id) as message_count
    FROM users u
    LEFT JOIN sessions s ON u.id = s.user_id
    LEFT JOIN messages m ON s.id = m.session_id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(userId)
}
```

---

## 8. Performance

### Indexing

```sql
-- ✅ Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ✅ Composite indexes
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at DESC);

-- ✅ Partial indexes
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

### Query Optimization

```typescript
// ✅ Use EXPLAIN to analyze queries
const plan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?").get("test@example.com")
console.log(plan)

// ✅ Use covering indexes
db.prepare(`
  SELECT id, email, name 
  FROM users 
  WHERE email = ?
`).get("test@example.com")

// ✅ Avoid SELECT * in production
db.prepare(`
  SELECT id, email, name 
  FROM users 
  WHERE role = ?
`).all("admin")
```

### Connection Optimization

```typescript
// ✅ Optimize connection settings
const db = new Database("devil-ai.db", {
  create: true,
  readwrite: true,
})

// Performance pragmas
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA synchronous = NORMAL")
db.exec("PRAGMA cache_size = -64000")  // 64MB cache
db.exec("PRAGMA temp_store = MEMORY")
db.exec("PRAGMA mmap_size = 268435456")  // 256MB mmap
```

---

## 9. Error Handling

### Database Errors

```typescript
// ✅ Error handling
export function safeQuery<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch (error) {
    console.error("Database error:", error)
    
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes("UNIQUE constraint")) {
        throw new Error("Record already exists")
      }
      
      if (error.message.includes("FOREIGN KEY constraint")) {
        throw new Error("Referenced record not found")
      }
    }
    
    throw error
  }
}

// Usage
const user = safeQuery(() => UserRepository.findById(id))
```

### Retry Logic

```typescript
// ✅ Retry on transient errors
export async function withRetry<T>(
  fn: () => T,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Check if retryable
      if (error instanceof Error && error.message.includes("SQLITE_BUSY")) {
        await Bun.sleep(delay * (i + 1))
        continue
      }
      
      throw error
    }
  }
  
  throw new Error("Max retries exceeded")
}
```

---

## 10. Best Practices

1. **Use WAL mode** — Better concurrency and performance
2. **Enable foreign keys** — Maintain referential integrity
3. **Prepare statements** — Cache for repeated queries
4. **Use transactions** — For multiple related operations
5. **Create indexes** — For frequently queried columns
6. **Avoid SELECT *** — Only select needed columns
7. **Use parameterized queries** — Never interpolate user input
8. **Handle errors gracefully** — Wrap database operations in try/catch
9. **Run migrations** — Version your schema changes
10. **Monitor performance** — Use EXPLAIN to analyze slow queries

---

## Commands

```bash
# Open SQLite REPL
sqlite3 devil-ai.db

# Run migrations
bun run db:migrate

# Backup database
sqlite3 devil-ai.db ".backup backup.db"

# Export to SQL
sqlite3 devil-ai.db .dump > backup.sql

# Import from SQL
sqlite3 devil-ai.db < backup.sql
```
