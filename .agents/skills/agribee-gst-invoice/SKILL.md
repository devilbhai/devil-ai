---
name: agribee-gst-invoice
description: GST invoice generation. Covers GST calculations, HSN/SAC codes, invoice templates, e-invoicing, compliance, return filing.
---

# AgriBee GST Invoice

## When to Apply
Use this skill when generating GST-compliant invoices, calculating tax implications, or managing e-invoicing requirements. Applies to billing systems, accounting integrations, and compliance workflows.

## Core Concepts
- **GST Structure**: CGST, SGST (intra-state), IGST (inter-state), Cess
- **HSN/SAC Codes**: Harmonized System of Nomenclature for goods, Services Accounting Codes
- **E-Invoicing**: IRN generation, QR code, invoice registration portal (IRP)
- **Compliance**: GSTR-1, GSTR-3B filing, input tax credit matching
- **Invoice Types**: Tax invoice, proforma, credit note, debit note

## Implementation
```typescript
interface GSTInvoice {
  invoiceNumber: string
  invoiceDate: Date
  seller: BusinessDetails
  buyer: BusinessDetails
  items: InvoiceItem[]
  subtotal: number
  gstBreakdown: {
    cgst: number
    sgst: number
    igst: number
    cess: number
  }
  totalAmount: number
  irn?: string // E-invoicing IRN
  qrCode?: string
}

interface InvoiceItem {
  description: string
  hsnCode: string
  quantity: number
  unit: string
  unitPrice: number
  taxableValue: number
  gstRate: number
  gstAmount: number
}

function calculateGST(item: InvoiceItem, isInterState: boolean): GSTBreakdown {
  const gstAmount = item.taxableValue * (item.gstRate / 100)
  if (isInterState) {
    return { igst: gstAmount, cgst: 0, sgst: 0, cess: 0 }
  }
  return { igst: 0, cgst: gstAmount / 2, sgst: gstAmount / 2, cess: 0 }
}
```

## Best Practices
- Always validate HSN codes against current GST rate schedule
- Generate e-invoice for B2B transactions above threshold (currently ₹5 crore)
- Maintain sequential invoice numbering without gaps
- Store invoices for 6 years as per GST Act requirements
- Reconcile input tax credit with GSTR-2B monthly
