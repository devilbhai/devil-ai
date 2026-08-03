---
name: system-monitor
description: System resource monitoring. CPU, RAM, disk, network tracking, alerting, visualization.
---

# System Monitor

## When to Apply
Use this skill when monitoring system resources: tracking CPU/RAM/disk/network usage, setting up alerts, or visualizing resource consumption patterns.

## Core Concepts
- Monitor via `/proc` (Linux), `sysctl` (macOS), or WMI (Windows)
- Use `top`/`htop`/`btop` for real-time monitoring
- `vmstat`, `iostat`, `sar` for historical data
- Alerts via thresholds on resource metrics
- Dashboard visualization with Grafana or custom tools

## Implementation

### Cross-platform System Info
```typescript
import os from "node:os"

function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  }
}
```

### Real-time Monitoring Script
```bash
#!/bin/bash
# Monitor CPU, RAM, disk every 5 seconds
while true; do
  echo "=== $(date) ==="
  echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
  echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
  echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
  sleep 5
done
```

### Alert Thresholds
```typescript
interface AlertThresholds {
  cpuPercent: number   // e.g., 90
  ramPercent: number   // e.g., 85
  diskPercent: number  // e.g., 90
}

function checkThresholds(metrics: SystemMetrics, thresholds: AlertThresholds) {
  const alerts: string[] = []
  if (metrics.cpuPercent > thresholds.cpuPercent) alerts.push("CPU high")
  if (metrics.ramPercent > thresholds.ramPercent) alerts.push("RAM high")
  if (metrics.diskPercent > thresholds.diskPercent) alerts.push("Disk high")
  return alerts
}
```

## Best Practices
- Use `os` module for cross-platform basic metrics
- Avoid polling too frequently; 5-30 second intervals are sufficient
- Store metrics in a time-series database (InfluxDB, Prometheus) for historical analysis
- Set up alerts for proactive issue detection
- Use `process.memoryUsage()` for Node.js-specific memory tracking
