---
name: database-migrator
description: Database migration planning, schema evolution, data transformation, and migration scripts.
---

# Database Migrator

## When to Apply
Use this skill when planning database migrations, evolving schemas, transforming data, or moving between database systems.

## Core Concepts
- Schema versioning
- Forward/rollback migrations
- Data transformation pipelines
- Zero-downtime migrations
- Cross-database migration

## Implementation

### Migration File Structure
```typescript
interface Migration {
  version: string
  name: string
  up: (db: Database) => Promise<void>
  down: (db: Database) => Promise<void>
}

// Example migration
const migration001: Migration = {
  version: "001",
  name: "add_user_email_index",
  up: async (db) => {
    await db.execute("CREATE INDEX idx_users_email ON users(email)")
  },
  down: async (db) => {
    await db.execute("DROP INDEX idx_users_email")
  }
}
```

### Schema Comparison
```typescript
interface SchemaDiff {
  added: { table: string; columns: ColumnDef[] }[]
  removed: { table: string }[]
  modified: { table: string; changes: ColumnChange[] }[]
}

function compareSchemas(source: Schema, target: Schema): SchemaDiff {
  // Compare tables, columns, indexes, constraints
  // Return diff with up/down operations
}
```

### Zero-Downtime Strategy
1. Add new column (nullable)
2. Deploy code that writes to both columns
3. Backfill existing data
4. Add NOT NULL constraint
5. Remove old column

## Best Practices
- Always test migrations on staging first
- Keep migrations atomic and reversible
- Back up data before major migrations
- Use feature flags for gradual rollout
- Monitor performance during migration
- Document rollback procedures
