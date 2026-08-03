---
name: agribee-seed-catalogue
description: Seed catalogue management. Covers seed varieties, catalog organization, seasonal availability, pricing, supplier management.
---

# AgriBee Seed Catalogue

## When to Apply
Use this skill when managing seed product catalogs, organizing seed varieties, handling seasonal availability, or processing seed-related queries from dealers and farmers.

## Core Concepts
- **Seed Varieties**: Hybrid, OPV (Open Pollinated Variety), GM, organic
- **Catalog Structure**: Category → Crop → Variety → Pack Size hierarchy
- **Seasonal Availability**: Kharif, Rabi, Zaid cycles with lead times
- **Supplier Management**: Seed companies, certification status, batch tracking
- **Pricing**: MRP, dealer margin, bulk discounts, seasonal adjustments

## Implementation
```typescript
interface SeedVariety {
  id: string
  name: string
  crop: string
  type: "hybrid" | "opv" | "gm" | "organic"
  maturityDays: number
  yieldPotential: string
  resistance: string[]
  packSizes: PackSize[]
  supplier: Supplier
  season: "kharif" | "rabi" | "zaid"
  certification: "truthful" | "foundation" | "certified"
}

interface Catalog {
  season: string
  year: number
  categories: CatalogCategory[]
  lastUpdated: Date
  version: string
}
```

## Best Practices
- Update catalog before each season with new varieties
- Include trial data and farmer testimonials for varieties
- Track certification expiry dates and renewal status
- Provide comparison tables for similar varieties
- Link varieties to compatible inputs (fertilizers, pesticides)
