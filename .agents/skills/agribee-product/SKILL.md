---
name: agribee-product
description: AgriBee product knowledge. Covers agricultural products, seeds, fertilizers, pesticides, crop management, product specifications.
---

# AgriBee Product Knowledge

## When to Apply
Use this skill when working with AgriBee product data, specifications, categories, or recommendations. Applies to product catalogs, farmer queries, dealer inventory, and marketing content.

## Core Concepts
- **Product Categories**: Seeds, fertilizers (NPK, organic), pesticides (insecticides, fungicides, herbicides), tools, equipment
- **Crop Management**: Crop lifecycle stages, input requirements, dosage recommendations
- **Specifications**: Composition, application rates, shelf life, storage conditions
- **Regulatory**: CIB registration, FCO compliance, label claims, safety data sheets
- **Seasonal**: Kharif (Jun-Oct), Rabi (Oct-Mar), Zaid (Mar-Jun) product cycles

## Implementation
```typescript
interface Product {
  id: string
  name: string
  category: "seed" | "fertilizer" | "pesticide" | "tool"
  specifications: ProductSpec
  crops: string[]
  season: ("kharif" | "rabi" | "zaid")[]
  price: PriceInfo
  regulatory: RegulatoryInfo
}

interface ProductSpec {
  composition?: string
  dosage: string
  shelfLife: number // days
  storageConditions: string
  packSizes: string[]
}
```

## Best Practices
- Always reference current season when recommending products
- Include safety warnings for chemical products
- Cross-reference product compatibility before combining recommendations
- Maintain up-to-date regulatory status (registration numbers, expiry)
- Localize product names and descriptions for regional markets
