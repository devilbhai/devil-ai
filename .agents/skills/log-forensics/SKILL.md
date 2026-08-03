---
name: log-forensics
description: Analyze application logs, detect anomalies, trace errors, and perform root cause analysis.
---

# Log Forensics

## When to Apply
Use this skill when investigating incidents, analyzing error patterns, tracing request flows, or performing post-mortems.

## Core Concepts
- Log parsing and aggregation
- Pattern detection
- Anomaly identification
- Timeline reconstruction
- Correlation analysis

## Implementation

### Parse Log Entry
```typescript
interface LogEntry {
  timestamp: Date
  level: "debug" | "info" | "warn" | "error" | "fatal"
  source: string
  message: string
  metadata?: Record<string, any>
  stack?: string
}

function parseLogLine(line: string): LogEntry | null {
  // Support common formats: JSON, syslog, Apache, etc.
  // Extract timestamp, level, source, message
  // Parse stack traces if present
}
```

### Detect Anomalies
```typescript
interface Anomaly {
  type: "spike" | "gap" | "pattern-change" | "new-error"
  timestamp: Date
  description: string
  severity: "low" | "medium" | "high"
}

function detectAnomalies(entries: LogEntry[]): Anomaly[] {
  // Error rate spikes
  // Time gaps in logs
  // New error patterns
  // Unusual request patterns
}
```

### Request Tracing
```typescript
function traceRequest(traceId: string, entries: LogEntry[]): LogEntry[] {
  return entries
    .filter(e => e.metadata?.traceId === traceId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
```

## Analysis Checklist
- [ ] Identify error patterns
- [ ] Check for related warnings before errors
- [ ] Measure time between events
- [ ] Find first occurrence of error
- [ ] Correlate with deployments/changes
- [ ] Check resource metrics (CPU, memory, disk)

## Best Practices
- Preserve raw logs before analysis
- Create timeline visualization
- Export findings for post-mortem
- Build runbooks for common issues
- Set up alerts for detected patterns
