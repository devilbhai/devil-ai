---
name: schema-visualizer
description: Visualize database schemas, relationships, and data flow diagrams.
---

# Schema Visualizer

## When to Apply
Use this skill when creating ER diagrams, visualizing table relationships, documenting schemas, or understanding complex database structures.

## Core Concepts
- Entity-Relationship diagrams
- Table relationship mapping
- Data flow visualization
- Schema documentation
- Mermaid/PlantUML generation

## Implementation

### Generate Mermaid ER Diagram
```typescript
function generateMermaidER(schema: DatabaseSchema): string {
  const lines: string[] = ["erDiagram"]
  
  for (const table of schema.tables) {
    lines.push(`  ${table.name} {`)
    for (const col of table.columns) {
      lines.push(`    ${col.type} ${col.name}${col.isPrimaryKey ? " PK" : ""}${col.isForeignKey ? " FK" : ""}`)
    }
    lines.push("  }")
  }
  
  for (const rel of schema.relationships) {
    lines.push(`  ${rel.from} ||--o{ ${rel.to} : "${rel.label}"`)
  }
  
  return lines.join("\n")
}
```

### Relationship Types
- One-to-One (1:1)
- One-to-Many (1:N)
- Many-to-Many (M:N) - requires junction table
- Self-referencing

### Visual Elements
- Primary keys (PK) - underlined
- Foreign keys (FK) - dashed border
- Not-null constraints - bold
- Default values - italic

## Best Practices
- Include all relationships, even self-referential
- Show cardinality (1, 0..1, 0..*, 1..*)
- Group related tables visually
- Add notes for complex relationships
- Keep diagrams readable (max 20 tables per diagram)
- Export as SVG/PNG for documentation
