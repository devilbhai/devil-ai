---
name: battery-monitor
description: Battery monitoring. Charge tracking, health estimation, power management.
---

# Battery Monitor

## When to Apply
Use this skill when monitoring battery status: tracking charge levels, estimating health, managing power settings, or optimizing energy consumption.

## Core Concepts
- Charge level: percentage of battery capacity remaining
- Cycle count: number of full charge/discharge cycles (affects lifespan)
- Design capacity vs full charge capacity indicates health degradation
- Power management: sleep, hibernate, display dimming
- Temperature affects battery health and safety

## Implementation

### Battery Status (macOS)
```bash
# Current status
pmset -g batt

# Detailed info
system_profiler SPPowerDataType

# Cycles and health
system_profiler SPPowerDataType | grep -E "Cycle Count|Condition|Max Capacity"
```

### Battery Status (Linux)
```bash
# Basic info
cat /sys/class/power_supply/BAT*/capacity
cat /sys/class/power_supply/BAT*/status

# Full details
upower -i /org/freedesktop/UPower/devices/battery_BAT0
```

### Node.js Battery Monitor
```typescript
import { execSync } from "node:child_process"
import os from "node:os"

interface BatteryInfo {
  level: number
  charging: boolean
  timeRemaining: number | null
  health: string
  cycleCount: number | null
}

function getBatteryInfo(): BatteryInfo | null {
  if (os.platform() !== "darwin" && os.platform() !== "linux") return null

  try {
    if (os.platform() === "darwin") {
      const output = execSync("pmset -g batt").toString()
      const levelMatch = output.match(/(\d+)%/)
      const charging = output.includes("charging") || output.includes("AC")
      return {
        level: levelMatch ? Number.parseInt(levelMatch[1]) : 0,
        charging,
        timeRemaining: null,
        health: "unknown",
        cycleCount: null,
      }
    }
  } catch {
    return null
  }
}
```

### Power Management Alerts
```typescript
function checkBatteryAlerts(level: number) {
  if (level <= 10) return "CRITICAL: Battery below 10%"
  if (level <= 20) return "WARNING: Battery below 20%"
  if (level >= 95) return "INFO: Battery nearly full"
  return null
}
```

### Periodic Monitoring
```bash
# macOS: Watch battery every 30 seconds
watch -n 30 "pmset -g batt"
```

## Best Practices
- Monitor cycle count to estimate remaining battery lifespan
- Keep charge between 20-80% for optimal long-term health
- Avoid extreme temperatures while charging
- Use `pmset` (macOS) or `tlp` (Linux) for power management
- Track battery health over time to detect degradation trends
