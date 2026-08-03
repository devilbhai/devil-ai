---
name: agribee-price-list
description: Price list generator. Covers dynamic pricing, seasonal adjustments, bulk pricing, dealer pricing, price comparison.
---

# AgriBee Price List Generator

## When to Apply
Use this skill when generating, managing, or updating price lists. Applies to product catalogs, dealer pricing, seasonal adjustments, and competitive analysis.

## Core Concepts
- **Pricing Strategies**: MRP, dealer price, bulk pricing, dynamic pricing
- **Seasonal Adjustments**: Demand-based pricing, festival offers, end-of-season discounts
- **Dealer Tiers**: Tier-based pricing, volume discounts, loyalty pricing
- **Price Comparison**: Competitor analysis, market positioning, margin analysis
- **Version Control**: Price history, effective dates, approval workflows

## Implementation
```typescript
interface PriceList {
  id: string
  name: string
  effectiveDate: Date
  expiryDate: Date
  prices: PriceEntry[]
  version: number
  status: "draft" | "active" | "archived"
}

interface PriceEntry {
  productId: string
  mrp: number
  dealerPrice: number
  distributorPrice: number
  bulkPrice?: BulkPrice[]
  tax: TaxInfo
  margin: number
}

interface BulkPrice {
  minQuantity: number
  maxQuantity?: number
  price: number
  discount: number
}

function generatePriceList(
  products: Product[],
  config: PricingConfig
): PriceList {
  return {
    id: generateId(),
    name: config.name,
    effectiveDate: config.effectiveDate,
    expiryDate: config.expiryDate,
    prices: products.map((p) => calculatePrice(p, config)),
    version: config.version,
    status: "draft",
  }
}
```

## Best Practices
- Maintain price version history for audit trail
- Set effective dates to avoid pricing conflicts
- Include GST in final prices for customer-facing lists
- Provide separate price lists for different dealer tiers
- Automate seasonal price adjustments based on demand patterns
