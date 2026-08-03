---
name: csv-processing
description: CSV data processing. Covers parsing, transformation, aggregation, validation, large file handling, streaming processing.
---

# CSV Data Processing

## When to Apply
- Parsing and transforming CSV data
- Aggregating and filtering large datasets
- Validating data quality and consistency
- Processing CSV files that exceed memory limits

## Core Concepts
- **Parsing**: Delimiter detection, quoting, escaping, encoding
- **Transformation**: Column mapping, type coercion, renaming
- **Aggregation**: Group-by, sum, count, average operations
- **Streaming**: Process files line-by-line for memory efficiency
- **Validation**: Schema checks, type validation, null handling

## Implementation

### Basic CSV Parsing (Node)
```ts
import * as fs from "node:fs"
import * as csv from "csv-parser"

function parseCSV(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}
```

### Streaming Large Files
```ts
import * as fs from "node:fs"
import * as csv from "csv-parser"

async function processLargeCSV(filePath: string) {
  return new Promise<void>((resolve) => {
    let count = 0
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        count++
        // Process each row without loading entire file
        if (count % 10000 === 0) console.log(`Processed ${count} rows`)
      })
      .on("end", () => {
        console.log(`Total: ${count} rows`)
        resolve()
      })
  })
}
```

### Write CSV
```ts
import * as fs from "node:fs"
import * as csv from "csv-writer"

async function writeCSV(data: Record<string, string>[], filePath: string) {
  const headers = Object.keys(data[0]).map((k) => ({ id: k, title: k }))
  const writer = csv.createObjectCsvWriter({ path: filePath, header: headers })
  await writer.writeRecords(data)
}
```

### Aggregation
```ts
function aggregate(data: Record<string, string>[], groupBy: string, aggField: string) {
  const groups: Record<string, number[]> = {}
  for (const row of data) {
    const key = row[groupBy]
    if (!groups[key]) groups[key] = []
    groups[key].push(Number(row[aggField]))
  }
  return Object.entries(groups).map(([key, values]) => ({
    group: key,
    sum: values.reduce((a, b) => a + b, 0),
    count: values.length,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  }))
}
```

### Validation
```ts
function validateCSV(data: Record<string, string>[], schema: Record<string, (v: string) => boolean>) {
  const errors: Array<{ row: number; field: string; error: string }> = []
  data.forEach((row, i) => {
    for (const [field, validator] of Object.entries(schema)) {
      if (!validator(row[field])) {
        errors.push({ row: i, field, error: `Invalid value: ${row[field]}` })
      }
    }
  })
  return errors
}
```

## Best Practices
- Detect encoding (UTF-8, Latin-1) before parsing
- Handle BOM (byte order mark) in UTF-8 files
- Use streaming for files > 10MB
- Quote fields containing delimiters or newlines
- Validate headers before processing
- Support different dialects (comma, semicolon, tab)
- Write BOM for Excel compatibility with UTF-8
