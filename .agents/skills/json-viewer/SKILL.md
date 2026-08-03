---
name: json-viewer
description: JSON visualization. Formatting, validation, tree view, comparison.
---

# JSON Viewer

## When to Apply

- Viewing and formatting JSON data
- Validating JSON structure
- Comparing JSON objects
- Editing JSON visually
- Exporting JSON to other formats

## Core Concepts

- **Formatting**: Pretty-printing, minification
- **Validation**: Syntax checking, schema validation
- **Tree View**: Hierarchical visualization
- **Comparison**: Diff between JSON objects
- **Editing**: Visual and text-based editing

## Implementation

```typescript
interface JSONDocument {
  id: string
  name: string
  content: any
  formatted: string
  isValid: boolean
  errors: JSONError[]
  statistics: JSONStatistics
}

interface JSONError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

interface JSONStatistics {
  depth: number
  keys: number
  arrays: number
  objects: number
  strings: number
  numbers: number
  booleans: number
  nulls: number
}

interface JSONDiff {
  path: string
  type: 'added' | 'removed' | 'modified'
  oldValue?: any
  newValue?: any
}

function formatJSON(
  data: any,
  indent: number = 2
): string {
  return JSON.stringify(data, null, indent)
}

function validateJSON(jsonString: string): {
  isValid: boolean
  errors: JSONError[]
} {
  try {
    JSON.parse(jsonString)
    return { isValid: true, errors: [] }
  } catch (error) {
    const match = jsonString.substring(0, 100).match(/position (\d+)/)
    const position = match ? parseInt(match[1]) : 0
    
    // Calculate line and column
    const lines = jsonString.substring(0, position).split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1
    
    return {
      isValid: false,
      errors: [
        {
          line,
          column,
          message: (error as Error).message,
          severity: 'error',
        },
      ],
    }
  }
}

function analyzeJSON(data: any, depth: number = 0): JSONStatistics {
  const stats: JSONStatistics = {
    depth,
    keys: 0,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  }
  
  if (Array.isArray(data)) {
    stats.arrays++
    data.forEach((item) => {
      const childStats = analyzeJSON(item, depth + 1)
      mergeStats(stats, childStats)
    })
  } else if (typeof data === 'object' && data !== null) {
    stats.objects++
    Object.keys(data).forEach((key) => {
      stats.keys++
      const childStats = analyzeJSON(data[key], depth + 1)
      mergeStats(stats, childStats)
    })
  } else if (typeof data === 'string') {
    stats.strings++
  } else if (typeof data === 'number') {
    stats.numbers++
  } else if (typeof data === 'boolean') {
    stats.booleans++
  } else if (data === null) {
    stats.nulls++
  }
  
  return stats
}

function mergeStats(target: JSONStatistics, source: JSONStatistics): void {
  target.depth = Math.max(target.depth, source.depth)
  target.keys += source.keys
  target.arrays += source.arrays
  target.objects += source.objects
  target.strings += source.strings
  target.numbers += source.numbers
  target.booleans += source.booleans
  target.nulls += source.nulls
}

function compareJSON(
  obj1: any,
  obj2: any,
  path: string = ''
): JSONDiff[] {
  const diffs: JSONDiff[] = []
  
  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2,
    })
    return diffs
  }
  
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      diffs.push({
        path,
        type: 'modified',
        oldValue: obj1,
        newValue: obj2,
      })
    }
    return diffs
  }
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    diffs.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2,
    })
    return diffs
  }
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  // Added keys
  keys2.filter((key) => !keys1.includes(key)).forEach((key) => {
    diffs.push({
      path: path ? `${path}.${key}` : key,
      type: 'added',
      newValue: obj2[key],
    })
  })
  
  // Removed keys
  keys1.filter((key) => !keys2.includes(key)).forEach((key) => {
    diffs.push({
      path: path ? `${path}.${key}` : key,
      type: 'removed',
      oldValue: obj1[key],
    })
  })
  
  // Modified keys
  keys1.filter((key) => keys2.includes(key)).forEach((key) => {
    const childPath = path ? `${path}.${key}` : key
    diffs.push(...compareJSON(obj1[key], obj2[key], childPath))
  })
  
  return diffs
}
```

## Best Practices

1. Validate JSON before processing
2. Use consistent formatting for readability
3. Handle large JSON files efficiently
4. Provide clear error messages
5. Support JSON Schema validation
6. Enable syntax highlighting
7. Allow export to other formats
8. Provide search and filter capabilities
9. Support JSON path queries
10. Use streaming for large files