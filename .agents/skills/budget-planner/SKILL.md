---
name: budget-planner
description: Personal and business budgeting, expense tracking, and financial planning.
---

# Budget Planner

## When to Apply
Use this skill when creating budgets, tracking expenses, analyzing spending patterns, or planning financial goals.

## Core Concepts
- Income/expense categorization
- Budget allocation methods
- Cash flow forecasting
- Savings goal tracking
- Financial health metrics

## Implementation

### Budget Structure
```typescript
interface Budget {
  id: string
  name: string
  period: "monthly" | "yearly" | "custom"
  income: IncomeItem[]
  expenses: ExpenseCategory[]
  savings: SavingsGoal[]
}

interface IncomeItem {
  source: string
  amount: number
  frequency: "weekly" | "biweekly" | "monthly" | "yearly"
  isGuaranteed: boolean
}

interface ExpenseCategory {
  name: string
  budgeted: number
  actual: number
  items: ExpenseItem[]
}

interface ExpenseItem {
  description: string
  amount: number
  date: Date
  recurring: boolean
  essential: boolean
}
```

### Budgeting Methods
- **50/30/20 Rule**: 50% needs, 30% wants, 20% savings
- **Zero-based**: Every dollar assigned a job
- **Envelope system**: Cash categories
- **Pay yourself first**: Savings before expenses

### Financial Health Metrics
```typescript
interface FinancialHealth {
  savingsRate: number        // savings / income
  debtToIncome: number      // debt payments / income
  emergencyFundMonths: number // savings / monthly expenses
  netWorth: number          // assets - liabilities
}
```

### Cash Flow Forecast
```typescript
function forecastCashFlow(
  balance: number,
  income: ScheduledTransaction[],
  expenses: ScheduledTransaction[],
  months: number
): MonthlyForecast[] {
  // Project balance forward based on scheduled transactions
  // Account for irregular expenses
  // Flag potential shortfalls
}
```

## Best Practices
- Track every expense for at least one month
- Review budget weekly
- Build 3-6 month emergency fund
- Automate savings transfers
- Adjust budget based on actual spending
