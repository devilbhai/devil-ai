---
name: agribee-dealer
description: Dealer management system. Covers dealer onboarding, inventory management, order processing, commission tracking, performance analytics.
---

# AgriBee Dealer Management

## When to Apply
Use this skill when managing dealer relationships, processing orders, tracking commissions, or analyzing dealer performance. Applies to dealer portals, sales dashboards, and CRM integrations.

## Core Concepts
- **Onboarding**: Registration, document verification, territory assignment, credit limits
- **Inventory**: Stock levels, reorder points, transfer between dealers, dead stock
- **Orders**: Purchase orders, returns, replacements, delivery tracking
- **Commission**: Tier-based commission, volume bonuses, incentive programs
- **Analytics**: Sales trends, target vs actual, territory performance, dealer ranking

## Implementation
```typescript
interface Dealer {
  id: string
  name: string
  territory: string
  tier: "bronze" | "silver" | "gold" | "platinum"
  creditLimit: number
  outstandingBalance: number
  inventory: DealerInventory[]
  salesTarget: number
  commission: CommissionConfig
}

interface Order {
  id: string
  dealerId: string
  items: OrderItem[]
  status: "pending" | "confirmed" | "shipped" | "delivered" | "returned"
  totalAmount: number
  commission: number
  createdAt: Date
}
```

## Best Practices
- Set credit limits based on dealer history and territory potential
- Implement real-time stock visibility across dealer network
- Automate commission calculations to avoid disputes
- Provide dealers with sales performance dashboards
- Run targeted promotions based on dealer inventory levels
