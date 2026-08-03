---
name: data-cleaning
description: Data cleaning and preprocessing. Covers missing data handling, outlier detection, data normalization, deduplication, format standardization.
---

# Data Cleaning & Preprocessing

## When to Apply
- Handling missing or null values in datasets
- Detecting and removing outliers
- Normalizing data formats (dates, phones, addresses)
- Removing duplicate records
- Standardizing inconsistent data

## Core Concepts
- **Missing data**: Drop, impute (mean/median/mode), or flag
- **Outliers**: Z-score, IQR, or domain-specific thresholds
- **Normalization**: Min-max scaling, z-score normalization
- **Deduplication**: Exact and fuzzy matching
- **Standardization**: Consistent date/phone/address formats

## Implementation

### Missing Data Handler
```ts
function handleMissing<T extends Record<string, unknown>>(
  data: T[],
  strategies: Partial<Record<keyof T, "drop" | "mean" | "median" | "mode" | "fill">>,
  fillValues?: Partial<Record<keyof T, unknown>>,
): T[] {
  const result = data.map((row) => ({ ...row }))

  for (const [field, strategy] of Object.entries(strategies) as Array<[keyof T, string]>) {
    const values = result
      .map((r) => r[field])
      .filter((v) => v !== null && v !== undefined && v !== "")

    if (strategy === "drop") {
      return result.filter((r) => r[field] !== null && r[field] !== undefined && r[field] !== "")
    }
    if (strategy === "mean" && values.every((v) => typeof v === "number")) {
      const avg = (values as number[]).reduce((a, b) => a + b, 0) / values.length
      result.forEach((r) => {
        if (r[field] === null || r[field] === undefined) r[field] = avg as T[keyof T]
      })
    }
    if (strategy === "fill" && fillValues?.[field] !== undefined) {
      result.forEach((r) => {
        if (r[field] === null || r[field] === undefined) r[field] = fillValues[field] as T[keyof T]
      })
    }
  }
  return result
}
```

### Outlier Detection
```ts
function detectOutliers(values: number[]): { indices: number[]; values: number[] } {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr

  const outliers: { indices: number[]; values: number[] } = { indices: [], values: [] }
  values.forEach((v, i) => {
    if (v < lower || v > upper) {
      outliers.indices.push(i)
      outliers.values.push(v)
    }
  })
  return outliers
}
```

### Deduplication
```ts
function deduplicate<T extends Record<string, unknown>>(
  data: T[],
  keyFields: (keyof T)[],
): T[] {
  const seen = new Set<string>()
  return data.filter((row) => {
    const key = keyFields.map((f) => String(row[f])).join("|")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Fuzzy dedup
function fuzzyDedup(data: string[], threshold = 0.9): string[] {
  const result: string[] = []
  for (const item of data) {
    const isDupe = result.some((r) => similarity(r, item) >= threshold)
    if (!isDupe) result.push(item)
  }
  return result
}
```

### Format Standardization
```ts
function standardizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`
  return phone
}

function standardizeDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().split("T")[0] // YYYY-MM-DD
}

function standardizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
```

### Z-Score Normalization
```ts
function zScoreNormalize(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
  return values.map((v) => (v - mean) / std)
}
```

## Best Practices
- Always audit data before cleaning (profile first)
- Document all transformations for reproducibility
- Handle missing data intentionally, not silently
- Validate cleaned data with constraints
- Keep original data separate from cleaned copies
- Use schemas to enforce expected types
- Log statistics before/after cleaning
