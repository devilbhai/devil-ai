---
name: agribee-stock
description: Stock/inventory management. Covers stock tracking, reorder alerts, warehouse management, batch tracking, expiry management.
---

# AgriBee Stock Management

## When to Apply
Use this skill when managing inventory, tracking stock levels, handling reorders, or managing warehouse operations. Applies to inventory systems, warehouse management, and supply chain workflows.

## Core Concepts
- **Stock Tracking**: Real-time quantity, location, movement history
- **Reorder Management**: Min/max levels, automatic reorder points, lead time
- **Batch Tracking**: Lot numbers, manufacturing dates, expiry dates
- **Warehouse**: Multi-location, zone management, bin mapping
- **Expiry Management**: FEFO (First Expiry First Out), batch expiry alerts

## Implementation
```typescript
interface StockItem {
  id: string
  productId: string
  warehouseId: string
  batchNumber: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  manufacturingDate: Date
  expiryDate: Date
  reorderLevel: number
  reorderQuantity: number
}

interface StockMovement {
  id: string
  productId: string
  fromLocation?: string
  toLocation?: string
  quantity: number
  type: "inbound" | "outbound" | "transfer" | "adjustment"
  reference: string // PO number, SO number, etc.
  timestamp: Date
}

function checkReorderAlerts(): StockItem[] {
  return stockItems.filter(
    (item) => item.availableQuantity <= item.reorderLevel
  )
}

function getExpiringItems(withinDays: number): StockItem[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  return stockItems.filter((item) => item.expiryDate <= cutoff)
}
```

## Best Practices
- Implement real-time stock synchronization across warehouses
- Use FEFO for perishable products (seeds, certain fertilizers)
- Set reorder levels based on historical demand and lead times
- Conduct regular cycle counts (monthly) and full audits (quarterly)
- Track stock movement reasons for better analytics
