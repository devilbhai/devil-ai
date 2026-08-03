---
name: crash-analyzer
description: Crash analysis. Stack trace parsing, root cause analysis, fix suggestions.
---

# Crash Analyzer

## When to Apply

- Analyzing application crashes
- Parsing stack traces
- Identifying root causes
- Suggesting fixes
- Tracking crash trends

## Core Concepts

- **Stack Trace Parsing**: Extracting meaningful information
- **Root Cause Analysis**: Identifying underlying issues
- **Crash Grouping**: Categorizing similar crashes
- **Fix Suggestions**: Recommending solutions
- **Crash Reporting**: Aggregating and analyzing crashes

## Implementation

```typescript
interface CrashReport {
  id: string
  timestamp: Date
  application: string
  version: string
  platform: string
  stackTrace: StackFrame[]
  error: ErrorInfo
  context: CrashContext
  userId?: string
  sessionId?: string
}

interface StackFrame {
  file: string
  line: number
  column: number
  function: string
  sourceCode?: string
  isNative: boolean
}

interface ErrorInfo {
  type: string
  message: string
  code?: string
  signal?: string
}

interface CrashContext {
  memory: { used: number; total: number }
  uptime: number
  os: string
  browser?: string
  deviceInfo?: string
}

interface CrashAnalysis {
  crashId: string
  rootCause: string
  suggestedFixes: string[]
  relatedCrashes: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  recurrenceCount: number
}

function parseStackTrace(stackTrace: string): StackFrame[] {
  const frames: StackFrame[] = []
  const lines = stackTrace.split('\n')
  
  for (const line of lines) {
    // Node.js style: at functionName (file:line:column)
    const nodeMatch = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
    if (nodeMatch) {
      frames.push({
        file: nodeMatch[2],
        line: parseInt(nodeMatch[3]),
        column: parseInt(nodeMatch[4]),
        function: nodeMatch[1],
        isNative: false,
      })
      continue
    }
    
    // Browser style: at file:line:column
    const browserMatch = line.match(/at\s+(.+?):(\d+):(\d+)/)
    if (browserMatch) {
      frames.push({
        file: browserMatch[1],
        line: parseInt(browserMatch[2]),
        column: parseInt(browserMatch[3]),
        function: 'anonymous',
        isNative: false,
      })
      continue
    }
  }
  
  return frames
}

function analyzeCrash(report: CrashReport): CrashAnalysis {
  // Find the most relevant frame (first non-native frame)
  const relevantFrame = report.stackTrace.find((frame) => !frame.isNative)
  
  let rootCause = 'Unknown'
  const suggestedFixes: string[] = []
  
  if (relevantFrame) {
    // Analyze based on error type
    switch (report.error.type) {
      case 'TypeError':
        rootCause = `Null or undefined reference in ${relevantFrame.function}`
        suggestedFixes.push('Check for null/undefined values before access')
        suggestedFixes.push('Add optional chaining (?.) for safe property access')
        break
      case 'ReferenceError':
        rootCause = `Undefined variable: ${report.error.message}`
        suggestedFixes.push('Check variable declaration')
        suggestedFixes.push('Verify import statements')
        break
      case 'RangeError':
        rootCause = 'Value outside valid range'
        suggestedFixes.push('Add input validation')
        suggestedFixes.push('Check array bounds')
        break
      default:
        rootCause = `${report.error.type}: ${report.error.message}`
        suggestedFixes.push('Review error message for clues')
        suggestedFixes.push('Add error handling')
    }
  }
  
  return {
    crashId: report.id,
    rootCause,
    suggestedFixes,
    relatedCrashes: [],
    severity: calculateSeverity(report),
    recurrenceCount: 1,
  }
}

function calculateSeverity(report: CrashReport): 'low' | 'medium' | 'high' | 'critical' {
  // Simple severity calculation
  if (report.error.type === 'Error' || report.error.type === 'TypeError') {
    return 'high'
  }
  
  if (report.context.memory.used > report.context.memory.total * 0.9) {
    return 'critical'
  }
  
  return 'medium'
}

function groupCrashes(reports: CrashReport[]): Map<string, CrashReport[]> {
  const groups = new Map<string, CrashReport[]>()
  
  for (const report of reports) {
    // Create a key based on error type and top stack frame
    const topFrame = report.stackTrace[0]
    const key = `${report.error.type}:${topFrame?.file}:${topFrame?.function}`
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(report)
  }
  
  return groups
}
```

## Best Practices

1. Include comprehensive error context
2. Use error boundaries in React
3. Implement global error handlers
4. Log errors to centralized service
5. Monitor crash rates and trends
6. Reproduce crashes locally
7. Write unit tests for edge cases
8. Use source maps for minified code
9. Implement graceful degradation
10. Regular crash analysis reviews