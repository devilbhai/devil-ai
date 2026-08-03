---
name: log-analyzer
description: Log analysis. Pattern detection, error aggregation, trend identification.
---

# Log Analyzer

## When to Apply

- Analyzing application logs
- Detecting patterns and anomalies
- Aggregating errors and warnings
- Identifying performance issues
- Monitoring system health

## Core Concepts

- **Pattern Detection**: Finding recurring messages
- **Error Aggregation**: Grouping similar errors
- **Trend Analysis**: Identifying changes over time
- **Performance Metrics**: Response times, throughput
- **Alerting**: Notifying on critical issues

## Implementation

```typescript
interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  source: string
  metadata: Record<string, any>
  stackTrace?: string
}

interface LogAnalysis {
  totalEntries: number
  errorCount: number
  warningCount: number
  levelDistribution: Record<string, number>
  sourceDistribution: Record<string, number>
  patterns: LogPattern[]
  errors: AggregatedError[]
  performance: PerformanceMetrics
}

interface LogPattern {
  pattern: string
  count: number
  firstSeen: Date
  lastSeen: Date
  examples: string[]
}

interface AggregatedError {
  message: string
  count: number
  firstSeen: Date
  lastSeen: Date
  stackTraces: string[]
  affectedSources: string[]
}

interface PerformanceMetrics {
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
}

function parseLogEntry(line: string): LogEntry | null {
  // Simple log parsing (adjust regex for your log format)
  const regex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+) \[(.*?)\] (.*)$/
  const match = line.match(regex)
  
  if (!match) return null
  
  return {
    timestamp: new Date(match[1]),
    level: match[2].toLowerCase() as any,
    message: match[4],
    source: match[3],
    metadata: {},
  }
}

function analyzeLogs(entries: LogEntry[]): LogAnalysis {
  const levelDistribution: Record<string, number> = {}
  const sourceDistribution: Record<string, number> = {}
  const errorPatterns = new Map<string, LogPattern>()
  const aggregatedErrors = new Map<string, AggregatedError>()
  
  let errorCount = 0
  let warningCount = 0
  
  entries.forEach((entry) => {
    // Count by level
    levelDistribution[entry.level] = (levelDistribution[entry.level] || 0) + 1
    
    if (entry.level === 'error' || entry.level === 'fatal') errorCount++
    if (entry.level === 'warn') warningCount++
    
    // Count by source
    sourceDistribution[entry.source] = (sourceDistribution[entry.source] || 0) + 1
    
    // Detect error patterns
    if (entry.level === 'error' || entry.level === 'fatal') {
      const pattern = entry.message.replace(/\d+/g, 'N').replace(/[a-f0-9]{8,}/g, 'ID')
      
      if (!errorPatterns.has(pattern)) {
        errorPatterns.set(pattern, {
          pattern,
          count: 0,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          examples: [],
        })
      }
      
      const patternData = errorPatterns.get(pattern)!
      patternData.count++
      patternData.lastSeen = entry.timestamp
      if (patternData.examples.length < 3) {
        patternData.examples.push(entry.message)
      }
      
      // Aggregate errors
      const errorKey = entry.message.substring(0, 100)
      if (!aggregatedErrors.has(errorKey)) {
        aggregatedErrors.set(errorKey, {
          message: entry.message,
          count: 0,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          stackTraces: [],
          affectedSources: [],
        })
      }
      
      const errorData = aggregatedErrors.get(errorKey)!
      errorData.count++
      errorData.lastSeen = entry.timestamp
      if (entry.stackTrace && errorData.stackTraces.length < 3) {
        errorData.stackTraces.push(entry.stackTrace)
      }
      if (!errorData.affectedSources.includes(entry.source)) {
        errorData.affectedSources.push(entry.source)
      }
    }
  })
  
  // Calculate performance metrics (mock data)
  const performance: PerformanceMetrics = {
    averageResponseTime: 150,
    p95ResponseTime: 500,
    p99ResponseTime: 1000,
    requestsPerSecond: 100,
    errorRate: errorCount / entries.length,
  }
  
  return {
    totalEntries: entries.length,
    errorCount,
    warningCount,
    levelDistribution,
    sourceDistribution,
    patterns: Array.from(errorPatterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    errors: Array.from(aggregatedErrors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    performance,
  }
}
```

## Best Practices

1. Use structured logging for easier analysis
2. Include timestamps and context in logs
3. Implement log rotation and retention
4. Set up alerts for critical errors
5. Monitor log volume and performance
6. Use log levels appropriately
7. Centralize logs for easier analysis
8. Regularly review error patterns
9. Correlate logs across services
10. Document common error solutions