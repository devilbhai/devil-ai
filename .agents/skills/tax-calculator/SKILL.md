---
name: tax-calculator
description: Tax calculation. Income tax, GST, TDS, tax planning, compliance.
---

# Tax Calculator

## When to Apply

- When building or modifying tax calculation features
- When implementing GST, TDS, or income tax logic
- When creating tax compliance or reporting tools
- When working with tax planning or estimation

## Core Concepts

- **Income Tax**: Slab-based calculation with deductions and exemptions
- **GST (Goods and Services Tax)**: CGST, SGST, IGST rates and input tax credit
- **TDS (Tax Deducted at Source)**: Deduction rates for different payment categories
- **Tax Planning**: Optimization strategies within legal frameworks
- **Compliance**: Filing deadlines, return formats, documentation requirements

## Implementation

```ts
// Tax slab definition
interface TaxSlab {
  minIncome: number
  maxIncome: number | null // null for highest slab
  rate: number // percentage
}

// GST calculation
function calculateGST(amount: number, rate: number, type: "intra" | "inter"): GSTResult {
  const tax = amount * (rate / 100)
  if (type === "intra") {
    return { cgst: tax / 2, sgst: tax / 2, igst: 0, total: tax }
  }
  return { cgst: 0, sgst: 0, igst: tax, total: tax }
}

// TDS deduction
function calculateTDS(payment: number, category: TDSCategory): number {
  const rate = TDS_RATES[category]
  return Math.round(payment * (rate / 100))
}

// Income tax (India-style slabs)
function calculateIncomeTax(annualIncome: number, slabs: TaxSlab[]): number {
  let tax = 0
  for (const slab of slabs) {
    const upper = slab.maxIncome ?? Infinity
    const taxableInSlab = Math.min(annualIncome, upper) - slab.minIncome
    if (taxableInSlab > 0) {
      tax += taxableInSlab * (slab.rate / 100)
    }
  }
  return tax
}
```

## Best Practices

- Keep tax rates and slabs configurable (they change annually)
- Always include cess and surcharge calculations where applicable
- Validate input amounts (no negative values for tax base)
- Support both old and new tax regimes where relevant
- Log all tax calculations for audit purposes
- Clearly label tax components in user-facing output
- Stay updated with latest tax law changes and update rate tables
- Separate tax calculation from business logic for easy maintenance
