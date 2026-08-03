---
name: expense-tracker
description: Expense management. Receipt scanning, categorization, budget tracking.
---

# Expense Tracker

## When to Apply
Use this skill when tracking expenses, scanning receipts, categorizing spending, or managing budgets.

## Core Concepts
- Expense categories: food, transport, office, travel, etc.
- Receipt scanning: OCR for automatic data extraction
- Budget management: set limits, track against budgets
- Recurring expenses: subscriptions, rent, utilities
- Reporting: daily, weekly, monthly, annual summaries

## Implementation

```typescript
interface Expense {
  id: string
  amount: number
  currency: string
  category: ExpenseCategory
  description: string
  date: Date
  receiptUrl?: string
  isRecurring: boolean
  recurringRule?: RecurringRule
  tags: string[]
}

type ExpenseCategory =
  | "food" | "transport" | "office" | "travel"
  | "software" | "marketing" | "utilities" | "other"

interface Budget {
  category: ExpenseCategory
  limit: number
  period: "monthly" | "yearly"
  spent: number
}

function categorizeExpense(expense: Partial<Expense>): ExpenseCategory {
  const keywords = {
    food: ["restaurant", "grocery", "coffee", "lunch"],
    transport: ["uber", "taxi", "gas", "parking"],
    office: ["supplies", "printer", "desk"],
    travel: ["hotel", "flight", "airbnb"],
  }

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(w => expense.description?.toLowerCase().includes(w))) {
      return category as ExpenseCategory
    }
  }
  return "other"
}

function trackBudget(expenses: Expense[], budgets: Budget[]): BudgetStatus[] {
  return budgets.map(budget => {
    const spent = expenses
      .filter(e => e.category === budget.category)
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      category: budget.category,
      limit: budget.limit,
      spent,
      remaining: budget.limit - spent,
      percentage: Math.round((spent / budget.limit) * 100),
    }
  })
}

function generateMonthlyReport(expenses: Expense[], month: number): MonthlyReport {
  const monthExpenses = expenses.filter(e => e.date.getMonth() === month)
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = groupBy(monthExpenses, "category")

  return {
    month,
    totalExpenses: total,
    transactionCount: monthExpenses.length,
    categoryBreakdown: byCategory,
    topExpense: monthExpenses.sort((a, b) => b.amount - a.amount)[0],
  }
}
```

## Best Practices
- Log expenses immediately after purchase
- Save receipts with every expense entry
- Review budgets weekly
- Use tags for project-level tracking
- Set up alerts for budget thresholds
- Export data monthly for accounting
