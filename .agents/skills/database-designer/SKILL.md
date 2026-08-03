---
name: database-designer
description: Database schema design. Table design, indexing, normalization, migration planning.
---

# Database Designer

## When to Apply
Use this skill when designing databases: creating table schemas, planning indexes, normalizing data, or managing migrations.

## Core Concepts
- Normalization: organizing data to reduce redundancy (1NF, 2NF, 3NF)
- Indexing: B-tree, hash indexes for query performance
- Relationships: one-to-one, one-to-many, many-to-many
- ACID: Atomicity, Consistency, Isolation, Durability
- Migrations: version-controlled schema changes

## Implementation

### SQLite Schema (Bun)
```typescript
import { Database } from "bun:sqlite"

const db = new Database("app.db")

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Index for common queries
db.run(`CREATE INDEX idx_posts_author ON posts(author_id)`)
db.run(`CREATE INDEX idx_posts_published ON posts(published, created_at)`)
db.run(`CREATE INDEX idx_users_email ON users(email)`)
```

### Migration Pattern
```typescript
interface Migration {
  version: number
  up: (db: Database) => void
  down: (db: Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.run(`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE)`)
    },
    down: (db) => {
      db.run(`DROP TABLE users`)
    },
  },
  {
    version: 2,
    up: (db) => {
      db.run(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''`)
    },
    down: (db) => {
      // SQLite doesn't support DROP COLUMN in older versions
    },
  },
]

function migrate(db: Database) {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)`)
  const current = db.query("SELECT MAX(version) as v FROM _migrations").get() as { v: number | null }
  const currentVersion = current?.v ?? 0

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db)
      db.run("INSERT INTO _migrations (version) VALUES (?)", [migration.version])
    }
  }
}
```

### Index Strategy
```sql
-- Primary key: automatically indexed
-- Foreign keys: always index for JOIN performance
CREATE INDEX idx_fk ON child_table(parent_id)

-- Composite index for multi-column queries
CREATE INDEX idx_status_date ON orders(status, created_at)

-- Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE active = TRUE
```

### Denormalization for Read Performance
```typescript
// When to denormalize:
// 1. Read-heavy workloads where JOINs are expensive
// 2. Frequently accessed computed values
// 3. Reporting/analytics queries

// Example: cached count
db.run(`
  CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    comment_count INTEGER DEFAULT 0  -- Denormalized count
  )
`)
```

## Best Practices
- Use TEXT for IDs (UUIDs) over integers for distributed systems
- Always define NOT NULL constraints where applicable
- Create indexes on foreign keys and frequent WHERE clause columns
- Use composite indexes for multi-column queries (order matters)
- Version-control migrations; never modify production schema manually
- Test migrations with production-like data volumes
