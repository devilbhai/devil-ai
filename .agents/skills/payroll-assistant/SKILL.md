---
name: payroll-assistant
description: Payroll processing. Salary calculation, deductions, payslip generation.
---

# Payroll Assistant

## When to Apply

- When building or modifying payroll processing features
- When implementing salary calculation or deduction logic
- When creating payslip generation or tax filing tools
- When working with employee compensation management

## Core Concepts

- **Salary Components**: Basic, HRA, allowances, bonuses, commissions
- **Ductions**: Tax, provident fund, insurance, loans, garnishments
- **Payroll Runs**: Periodic processing (monthly, bi-weekly, weekly)
- **Payslips**: Detailed earnings and deductions statements
- **Compliance**: Tax withholdings, statutory contributions, filing requirements

## Implementation

```ts
// Salary structure
interface SalaryStructure {
  employeeId: string
  components: {
    basic: number
    hra: number
    allowances: { name: string; amount: number }[]
    bonuses: { name: string; amount: number; frequency: string }[]
  }
  currency: string
  effectiveDate: Date
}

// Payslip
interface Payslip {
  id: string
  employeeId: string
  period: { month: number; year: number }
  earnings: { component: string; amount: number }[]
  deductions: { component: string; amount: number }[]
  grossPay: number
  totalDeductions: number
  netPay: number
  paidAt: Date
  status: "draft" | "approved" | "paid" | "voided"
}

// Payroll run
interface PayrollRun {
  id: string
  period: { month: number; year: number }
  processedAt: Date
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  status: "processing" | "completed" | "approved" | "paid"
}
```

```ts
// Calculate net pay
function calculateNetPay(salary: SalaryStructure, deductions: Deduction[]): number {
  const gross = salary.components.basic + salary.components.hra +
    salary.components.allowances.reduce((sum, a) => sum + a.amount, 0)
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
  return gross - totalDeductions
}

// Generate payslip PDF
async function generatePayslip(payslip: Payslip): Promise<Buffer> {
  const template = await loadTemplate("payslip")
  const html = template.render(payslip)
  return await convertToPDF(html)
}
```

## Best Practices

- Process payroll in batches with review/approval steps before disbursement
- Support retroactive pay adjustments for salary changes mid-period
- Automate tax calculations based on current tax tables
- Keep payroll data encrypted and access-controlled
- Generate audit-ready reports for statutory compliance
- Support multiple pay frequencies within the same organization
- Maintain payroll history for at least 7 years for compliance
- Integrate with accounting software for journal entry posting
