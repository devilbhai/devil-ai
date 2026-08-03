---
name: erp-assistant
description: ERP system management. Module configuration, data migration, reporting.
---

# ERP Assistant

## When to Apply

- When integrating with or building ERP system features
- When implementing module configuration or data migration
- When building ERP reporting or dashboard components
- When working with inventory, procurement, or manufacturing modules

## Core Concepts

- **Modules**: Finance, HR, Inventory, Sales, Purchase, Manufacturing, CRM
- **Master Data**: Products, customers, vendors, chart of accounts
- **Transactions**: Sales orders, purchase orders, invoices, journal entries
- **Workflow**: Approval chains, routing rules, escalation policies
- **Data Migration**: Import/export, transformation, validation, reconciliation
- **Customization**: Custom fields, forms, reports without modifying core

## Implementation

```ts
// ERP module registry
interface ERPModule {
  id: string
  name: string
  enabled: boolean
  permissions: string[]
  config: Record<string, unknown>
}

// Data migration record
interface MigrationRecord {
  sourceSystem: string
  targetModule: string
  records: unknown[]
  mapping: FieldMapping[]
  validationRules: ValidationRule[]
}

// Field mapping for migration
interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: (value: unknown) => unknown
  required: boolean
  defaultValue?: unknown
}

// Generic ERP entity
interface ERPEntity {
  id: string
  type: string
  attributes: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

```ts
// Data migration pipeline
async function migrateData(config: MigrationConfig): Promise<MigrationResult> {
  const records = await fetchSourceData(config.source)
  const transformed = records.map((r) => transformRecord(r, config.mapping))
  const validated = transformed.filter((r) => validateRecord(r, config.rules))
  const result = await importToERP(validated, config.target)
  return { imported: result.success, failed: result.errors, total: records.length }
}
```

## Best Practices

- Always validate data before migration; create error logs for rejected records
- Use idempotent operations for data imports (safe to re-run)
- Keep module configuration in version-controlled config files
- Implement soft deletes for ERP data to maintain audit trails
- Use transactions for multi-step operations to ensure consistency
- Separate customization from core ERP logic to simplify upgrades
- Maintain referential integrity across modules
- Document all custom fields and their business purpose
