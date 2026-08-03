---
name: finance-assistant
description: Financial management. Budgeting, forecasting, financial analysis, reporting.
---

# Finance Assistant

## When to Apply

- When creating or modifying financial management features
- When implementing budgeting or forecasting logic
- When building financial analysis or reporting tools
- When working with financial data aggregation or visualization

## Core Concepts

- **Budget Planning**: Define, track, and analyze budgets across departments or projects
- **Financial Forecasting**: Predict future revenue, expenses, and cash flow trends
- **Financial Statements**: Generate income statements, balance sheets, cash flow statements
- **KPI Tracking**: Monitor key financial metrics (revenue, margins, burn rate, runway)
- **Variance Analysis**: Compare actual vs. budgeted performance
- **Scenario Modeling**: What-if analysis for financial planning

## Implementation

```ts
// Budget item structure
interface BudgetItem {
  id: string
  category: string
  allocated: number
  spent: number
  currency: string
  period: "monthly" | "quarterly" | "yearly"
}

// Financial summary
interface FinancialSummary {
  revenue: number
  expenses: number
  profit: number
  margin: number
  period: DateRange
}

// Forecast data point
interface ForecastEntry {
  date: Date
  metric: string
  predicted: number
  confidence: number
  actual?: number
}
```

```ts
// Budget variance calculation
function calculateVariance(budgeted: number, actual: number) {
  const variance = actual - budgeted
  const percentage = (variance / budgeted) * 100
  return { variance, percentage, isOver: variance > 0 }
}

// Cash flow projection
function projectCashFlow(transactions: Transaction[], months: number): CashFlowProjection {
  // Aggregate historical patterns and project forward
}
```

## Best Practices

- Always use decimal-safe arithmetic for financial calculations (use `BigInt` or a library like `decimal.js` for precision)
- Store monetary values as integer cents/minor units to avoid floating-point errors
- Include currency in all monetary displays and comparisons
- Implement audit trails for all financial modifications
- Separate calculation logic from presentation
- Validate all financial inputs with strict ranges and formats
- Support multi-currency with proper conversion rates
- Maintain historical snapshots for trend analysis
