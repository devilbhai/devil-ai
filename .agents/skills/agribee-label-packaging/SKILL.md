---
name: agribee-label-packaging
description: Label and packaging design. Covers product labels, barcodes, nutritional info, regulatory compliance, packaging specifications.
---

# AgriBee Label & Packaging

## When to Apply
Use this skill when designing product labels, packaging specifications, or regulatory compliance documentation. Applies to product manufacturing, quality control, and regulatory submissions.

## Core Concepts
- **Label Requirements**: Product name, manufacturer details, batch number, MRP, net weight
- **Regulatory**: FCO (Fertilizer Control Order), CIB (Central Insecticides Board) compliance
- **Barcodes**: EAN-13, QR codes, internal tracking codes
- **Nutritional/Composition**: NPK content, active ingredient percentage, safety warnings
- **Packaging**: Material specifications, sizes, sustainability requirements

## Implementation
```typescript
interface ProductLabel {
  productId: string
  labelType: "front" | "back" | "side" | "wrap"
  dimensions: { width: number; height: number; unit: "mm" | "cm" | "in" }
  content: LabelContent
  regulatory: RegulatoryLabel[]
  barcode: BarcodeInfo
}

interface LabelContent {
  productName: string
  manufacturer: Address
  batchNumber: string
  manufacturingDate: Date
  expiryDate: Date
  netWeight: string
  mrp: number
  composition?: string
  directions?: string
  warnings?: string[]
  storageInstructions?: string
}

interface BarcodeInfo {
  type: "ean13" | "qr" | "code128"
  value: string
  placement: { x: number; y: number }
}

function generateBarcode(product: Product): BarcodeInfo {
  return {
    type: "ean13",
    value: calculateEAN13(product.sku),
    placement: { x: 10, y: 10 },
  }
}
```

## Best Practices
- Include all mandatory regulatory information per FCO/CIB guidelines
- Use high-contrast colors for barcode readability
- Test label durability under field conditions (heat, moisture)
- Maintain consistent branding across product lines
- Keep label templates version-controlled for traceability
