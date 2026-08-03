---
name: cpu-monitor
description: CPU usage monitoring. Load tracking, process analysis, temperature monitoring, optimization.
---

# CPU Monitor

## When to Apply
Use this skill when monitoring CPU usage: tracking load averages, analyzing process CPU consumption, monitoring temperature, or optimizing CPU-bound workloads.

## Core Concepts
- Load average represents runnable + uninterruptible processes over 1/5/15 min
- CPU usage = 100% - idle% from `/proc/stat` or `top`
- Process-level CPU via `ps`, `top`, or `pidstat`
- Temperature via `lm-sensors` (Linux), `powermetrics` (macOS)
- Context switches and interrupts indicate scheduling pressure

## Implementation

### CPU Usage Tracking
```typescript
import os from "node:os"

function getCpuUsage(): number {
  const cpus = os.cpus()
  const totals = cpus.reduce(
    (acc, cpu) => {
      for (const type of Object.keys(cpu.times) as Array<keyof CPUTimes>) {
        acc.total += cpu.times[type]
        if (type !== "idle") acc.nonIdle += cpu.times[type]
      }
      return acc
    },
    { total: 0, nonIdle: 0 },
  )
  return (totals.nonIdle / totals.total) * 100
}
```

### Load Average Monitor
```bash
# Get load averages
cat /proc/loadavg | awk '{print $1, $2, $3}'

# Compare to CPU count
NPROC=$(nproc)
LOAD=$(cat /proc/loadavg | awk '{print $1}')
if (( $(echo "$LOAD > $NPROC" | bc -l) )); then
  echo "CPU overloaded: $LOAD > $NPROC"
fi
```

### Process Analysis
```bash
# Top CPU-consuming processes
ps aux --sort=-%cpu | head -10

# Monitor specific process
pidstat -p <PID> 1

# macOS equivalent
ps -eo pid,pcpu,comm | sort -k2 -rn | head -10
```

### Temperature Monitoring
```bash
# Linux with lm-sensors
sensors

# macOS
sudo powermetrics --samplers smc -i 1000 -n 1 | grep -i temp
```

## Best Practices
- Monitor load average relative to CPU core count, not absolute values
- Track both overall and per-core usage for accurate analysis
- Profile CPU-bound code with `--prof` flag in Node.js
- Use worker threads or child processes to offload CPU-intensive work
- Set alerts at 80-90% sustained CPU usage
