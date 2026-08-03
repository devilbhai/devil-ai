---
name: sql-postgresql
description: SQL and PostgreSQL expert. Covers queries, joins, subqueries, window functions, CTEs, indexing, query optimization, migrations, stored procedures, triggers.
---

# SQL & PostgreSQL Expert

## When to Apply
Use this skill when working with SQL databases, especially PostgreSQL. Apply when:
- Writing or optimizing complex SQL queries
- Designing database schemas and tables
- Implementing indexes for query performance
- Using window functions, CTEs, or subqueries
- Writing migrations or schema changes
- Creating stored procedures, functions, or triggers
- Debugging slow queries or execution plans
- Working with PostgreSQL-specific features (JSONB, arrays, full-text search)
- Implementing data integrity constraints
- Setting up replication, partitioning, or backup strategies

## Core Patterns

### Query Writing
- Use CTEs (`WITH` clauses) for complex multi-step queries
- Use window functions over correlated subqueries for ranking and aggregation
- Use `EXISTS` over `IN` for subqueries checking existence
- Use `DISTINCT ON` (PostgreSQL) instead of `GROUP BY` for first-row-per-group
- Prefer `JOIN` over subqueries when possible — the optimizer handles both well
- Use `COALESCE` and `NULLIF` for null handling
- Use `LATERAL` joins for row-by-row subqueries
- Always alias computed columns for readability

### Window Functions
- Use `ROW_NUMBER()` for unique sequential numbering
- Use `RANK()` or `DENSE_RANK()` when ties matter
- Use `LAG()` / `LEAD()` for accessing previous/next rows
- Use `FIRST_VALUE()` / `LAST_VALUE()` for range-based lookups
- Use `NTILE()` for distributing rows into buckets
- Define window frames with `ROWS BETWEEN` for precise control
- Use `PARTITION BY` to reset calculations per group

### Indexing
- Create indexes on columns used in `WHERE`, `JOIN`, and `ORDER BY`
- Use composite indexes with columns in the order of selectivity
- Use partial indexes for queries filtering on a constant subset
- Use GIN indexes for JSONB, arrays, and full-text search
- Use GiST for geometric and range queries
- Use `CREATE INDEX CONCURRENTLY` to avoid locking production tables
- Use covering indexes (`INCLUDE`) for index-only scans
- Monitor with `pg_stat_user_indexes` to find unused indexes

### Schema Design
- Use appropriate data types: `uuid`, `timestamptz`, `jsonb`, `numeric`
- Always define `NOT NULL` constraints — avoid nullable columns unless necessary
- Use `DEFAULT` values for columns that should always have a value
- Use foreign keys with `ON DELETE CASCADE` or `RESTRICT` intentionally
- Use `CHECK` constraints for domain validation at the database level
- Use `GENERATED ALWAYS AS` for computed columns
- Use `ENUM` types for fixed sets of values
- Normalize to 3NF, then denormalize strategically for performance

### Query Optimization
- Use `EXPLAIN (ANALYZE, BUFFERS)` to inspect query plans
- Look for sequential scans on large tables — add indexes
- Avoid `SELECT *` — fetch only needed columns
- Use `LIMIT` with efficient `ORDER BY` + index for pagination
- Use `WHERE` clause that matches index column order
- Avoid functions on indexed columns in `WHERE` (prevents index usage)
- Use `SET work_mem` for large sorts and hashes in analytical queries
- Use `EXPLAIN (FORMAT JSON)` for programmatic plan analysis

### Migrations
- Always use reversible migrations when possible
- Add new columns as nullable first, backfill, then add `NOT NULL`
- Use `CREATE INDEX CONCURRENTLY` in migrations to avoid downtime
- Test migrations on a copy of production data
- Use transaction wrapping for DDL changes
- Never drop columns without a deprecation period
- Use `IF EXISTS` / `IF NOT EXISTS` for idempotent migrations

### PostgreSQL-Specific Features
- Use `JSONB` operators (`@>`, `?`, `->`, `->>`) for JSON queries
- Use array types and operators (`ANY`, `ALL`, `@>`, `&&`) for list data
- Use `LATERAL` for row-by-row subquery evaluation
- Use `RETURNING` clause to get modified rows from INSERT/UPDATE/DELETE
- Use `UPSERT` (`INSERT ... ON CONFLICT`) for atomic insert-or-update
- Use `pg_trgm` extension for fuzzy text matching
- Use `LISTEN` / `NOTIFY` for real-time pub/sub within PostgreSQL
- Use `MATERIALIZED VIEW` for expensive pre-computed queries

## Code Examples

### Window Functions
```sql
-- Rank employees within each department by salary
SELECT
    employee_id,
    department_id,
    name,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS row_num,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank,
    salary - LAG(salary) OVER (PARTITION BY department_id ORDER BY salary) AS salary_diff,
    PERCENT_RANK() OVER (PARTITION BY department_id ORDER BY salary) AS percentile
FROM employees;
```

### CTE with Recursive Query
```sql
-- Find all ancestors in an organizational hierarchy
WITH RECURSIVE org_tree AS (
    -- Base case: direct reports to a manager
    SELECT id, name, manager_id, 1 AS depth
    FROM employees
    WHERE manager_id = 42

    UNION ALL

    -- Recursive case: reports to reports
    SELECT e.id, e.name, e.manager_id, t.depth + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.id
    WHERE t.depth < 10  -- Prevent infinite recursion
)
SELECT * FROM org_tree ORDER BY depth, name;
```

### JSONB Query
```sql
-- Find products where tags contain a specific value
SELECT
    id,
    name,
    metadata->>'color' AS color,
    jsonb_array_length(tags) AS tag_count
FROM products
WHERE tags @> '["sale"]'::jsonb
  AND metadata->>'category' = 'electronics'
  AND (metadata->>'rating')::numeric > 4.5;
```

### Upsert with Returning
```sql
-- Insert or update user email, return the affected row
INSERT INTO users (email, name, last_login)
VALUES ('user@example.com', 'John', NOW())
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    last_login = EXCLUDED.last_login
RETURNING id, email, name, last_login;
```

### Partial Index
```sql
-- Index only active orders for faster queries
CREATE INDEX CONCURRENTLY idx_orders_active_status
ON orders (status, created_at)
WHERE status IN ('pending', 'processing', 'shipped');

-- Query that benefits from partial index
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 50;
```

### Query Optimization with EXPLAIN
```sql
-- Analyze a slow query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at > NOW() - INTERVAL '30 days'
  AND o.total > 100
ORDER BY o.total DESC;

-- Look for:
-- Seq Scan on large tables (needs index)
-- Nested Loop with high row estimates
-- Sort operations with high memory usage
-- Hash Join with poor join selectivity
```

## Best Practices
- Always use `EXPLAIN (ANALYZE)` before optimizing — measure, don't guess
- Use `timestamptz` over `timestamp` for timezone-aware timestamps
- Use `uuid` for primary keys in distributed systems
- Define `NOT NULL` constraints on all columns unless nulls are meaningful
- Use `numeric` for monetary values — never `float`
- Create indexes on foreign key columns — PostgreSQL doesn't auto-index them
- Use `CREATE INDEX CONCURRENTLY` for production index creation
- Partition large tables (100M+ rows) by date or logical boundaries
- Use connection pooling (PgBouncer) for high-concurrency applications
- Set `statement_timeout` to prevent runaway queries
- Use `pg_dump` for backups and `pg_restore` for point-in-time recovery
- Test migrations against production-size datasets before deploying
- Keep transactions short — long transactions block vacuum and cause bloat
