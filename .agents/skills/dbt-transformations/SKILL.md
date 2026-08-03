---
name: dbt-transformations
description: Data transformations with dbt - models, tests, documentation, data quality.
---

# dbt Transformations

## When to Apply
Use this skill for analytics engineering, data modeling, transformations in data warehouse, or building data marts.

## Core Concepts
- Models (SQL files)
- Tests (schema and data tests)
- Documentation generation
- Snapshots for SCD Type 2
- Seeds for static data
- Macros for reusable logic
- Sources and refs
- Packages and plugins

## Best Practices
- Use staging models for raw data cleaning
- Build intermediate models for business logic
- Create mart models for analytics
- Test all models (at least unique and not_null)
- Document columns and relationships
- Use snapshots for historical data
- Version control everything
- Use jinja for dynamic SQL

## Model Structure
```sql
-- models/staging/stg_orders.sql
with source as (
    select * from {{ source('raw', 'orders') }}
),
renamed as (
    select
        id as order_id,
        user_id,
        status,
        created_at
    from source
)
select * from renamed
```

## Tests
```yaml
models:
  - name: stg_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: status
        tests:
          - accepted_values:
              values: ['pending', 'shipped', 'delivered']
```

## Macros
```sql
-- macros/created_at_to_date.sql
{% macro created_at_to_date(column_name) %}
    cast({{ column_name }} as date)
{% endmacro %}
```

## Snapshots
```sql
-- snapshots/orders_snapshot.sql
{% snapshot orders_snapshot %}
{{
    config(
        target_schema='snapshots',
        unique_key='order_id',
        strategy='timestamp',
        updated_at='updated_at'
    )
}}
select * from {{ source('raw', 'orders') }}
{% endsnapshot %}
```
