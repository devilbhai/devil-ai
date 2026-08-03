---
name: mysql-expert
description: MySQL database. Query optimization, indexing, replication, partitioning.
---

# MySQL Expert

## When to Apply
Use this skill when designing, optimizing, or maintaining MySQL databases, including schema design, query tuning, replication setup, and production database operations.

## Core Concepts
- **InnoDB Storage Engine**: Transactions, row-level locking, MVCC, foreign keys, buffer pool tuning
- **Indexing**: B-tree indexes, composite indexes, covering indexes, index merge, partial indexes (8.0+)
- **Query Optimization**: EXPLAIN analysis, query plan interpretation, index hints, subquery optimization
- **Replication**: Primary-replica, semi-synchronous, group replication, GTID-based replication
- **Partitioning**: Range, list, hash, key partitioning, partition pruning, subpartitioning
- **Transactions**: ACID, isolation levels, deadlock detection, lock wait timeouts
- **Security**: User privileges, SSL/TLS, SQL injection prevention, audit logging

## Implementation
```sql
-- Optimized schema with proper indexing
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_email (email),
    INDEX idx_status_created (status, created_at),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Composite index for common query pattern
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status_created (user_id, status, created_at),
    INDEX idx_status_amount (status, total_amount)
) ENGINE=InnoDB;

-- Query with EXPLAIN analysis
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE u.status = 'active'
  AND o.created_at >= '2026-01-01'
GROUP BY u.id
HAVING order_count > 5
ORDER BY total_spent DESC
LIMIT 20;

-- Partitioned table for time-series data
CREATE TABLE events (
    id BIGINT UNSIGNED AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    payload JSON,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id, created_at),
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB
PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p2026_q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p2026_q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
    PARTITION p2026_q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p2026_q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Deadlock-safe transaction pattern
START TRANSACTION;
SELECT id FROM accounts WHERE user_id = 1 FOR UPDATE SKIP LOCKED;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;
COMMIT;
```

## Best Practices
- Always use EXPLAIN to verify query execution plans after schema changes
- Create composite indexes in the order of query WHERE/JOIN conditions
- Use covering indexes to avoid table lookups for frequently queried columns
- Set `innodb_buffer_pool_size` to 70-80% of available RAM on dedicated servers
- Use `utf8mb4` character set for full Unicode support (including emoji)
- Monitor `SHOW ENGINE INNODB STATUS` for lock contention and deadlocks
- Use pt-query-digest to identify slow queries from slow query log
- Test replication lag and failover procedures regularly
