---
name: snowflake-warehouse
description: Snowflake data warehousing - tables, queries, performance tuning, data sharing, cost optimization.
---

# Snowflake Warehouse

## When to Apply
Use this skill for Snowflake development, query optimization, data sharing, or warehouse management.

## Core Concepts
- Virtual warehouses and sizing
- Clones and time travel
- Zero-copy cloning
- Streams and tasks
- Data sharing and marketplace
- Multi-cluster warehouses
- Resource monitors

## Best Practices
- Use appropriate warehouse sizes
- Implement auto-suspend/resume
- Use materialized views for complex queries
- Leverage time travel for data recovery
- Use streams for CDC
- Monitor credit consumption
- Use resource monitors for cost control

## Table Types
```sql
-- Permanent table
CREATE TABLE orders (
    order_id NUMBER,
    user_id NUMBER,
    amount DECIMAL(10,2),
    created_at TIMESTAMP_NTZ
);

-- Temporary table
CREATE TEMPORARY TABLE temp_results AS
SELECT * FROM orders WHERE amount > 100;

-- Transient table
CREATE TRANSIENT TABLE staging_data (
    data VARIANT
);
```

## Performance Tuning
```sql
-- Clustering key
ALTER TABLE orders CLUSTER BY (created_at);

-- Materialized view
CREATE MATERIALIZED VIEW daily_sales AS
SELECT date_trunc('day', created_at) as day, sum(amount)
FROM orders GROUP BY 1;

-- Query result cache
SELECT /* USE_RESULT_CACHE_CACHE */ * FROM orders;
```

## Streams and Tasks
```sql
-- Stream for CDC
CREATE STREAM orders_stream ON TABLE orders APPEND_ONLY = FALSE;

-- Task for scheduling
CREATE TASK daily_agg
  WAREHOUSE = compute_wh
  SCHEDULE = 'USING CRON 0 0 * * * UTC'
AS
  INSERT INTO daily_sales_summary
  SELECT * FROM orders_stream;
```

## Cost Optimization
- Use resource monitors
- Set auto-suspend policy
- Right-size warehouses
- Use multi-cluster for concurrency
- Leverage shared databases
