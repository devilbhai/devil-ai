---
name: iot-controller
description: IoT device management. Device control, data collection, automation rules.
---

# IoT Controller

## When to Apply

- Managing IoT devices
- Collecting sensor data
- Creating automation rules
- Monitoring device health
- Controlling devices remotely

## Core Concepts

- **Device Management**: Registration, configuration, updates
- **Data Collection**: Sensor readings, telemetry
- **Automation Rules**: Trigger-action programming
- **Protocol Support**: MQTT, CoAP, HTTP, WebSocket
- **Edge Computing**: Local processing and decisions

## Implementation

```typescript
interface IoTDevice {
  id: string
  name: string
  type: string
  manufacturer: string
  model: string
  firmware: string
  status: 'online' | 'offline' | 'error' | 'updating'
  lastSeen: Date
  location: string
  capabilities: string[]
  sensors: Sensor[]
  actuators: Actuator[]
}

interface Sensor {
  id: string
  name: string
  type: string
  unit: string
  currentValue: number
  minValue: number
  maxValue: number
  lastReading: Date
}

interface Actuator {
  id: string
  name: string
  type: string
  state: 'on' | 'off' | 'auto'
  lastCommand: Date
}

interface AutomationRule {
  id: string
  name: string
  trigger: Trigger
  conditions: Condition[]
  actions: Action[]
  isEnabled: boolean
  lastTriggered?: Date
}

interface Trigger {
  type: 'sensor' | 'time' | 'manual' | 'device'
  deviceId?: string
  sensorId?: string
  threshold?: number
  schedule?: string
}

interface Condition {
  type: 'sensor' | 'time' | 'device'
  deviceId?: string
  sensorId?: string
  operator: '>' | '<' | '=' | '>=' | '<='
  value: number
}

interface Action {
  type: 'device' | 'notification' | 'webhook'
  deviceId?: string
  actuatorId?: string
  command: string
  parameters?: Record<string, any>
}

function processSensorData(data: number[], windowSize: number): {
  average: number
  min: number
  max: number
  trend: 'increasing' | 'decreasing' | 'stable'
} {
  const window = data.slice(-windowSize)
  const average = window.reduce((a, b) => a + b, 0) / window.length
  const min = Math.min(...window)
  const max = Math.max(...window)
  
  // Simple trend detection
  const firstHalf = window.slice(0, Math.floor(window.length / 2))
  const secondHalf = window.slice(Math.floor(window.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (secondAvg > firstAvg * 1.1) trend = 'increasing'
  else if (secondAvg < firstAvg * 0.9) trend = 'decreasing'
  
  return { average, min, max, trend }
}

function evaluateRule(rule: AutomationRule, deviceData: Map<string, any>): boolean {
  // Evaluate trigger
  let triggerMet = false
  
  switch (rule.trigger.type) {
    case 'sensor':
      const sensorData = deviceData.get(rule.trigger.deviceId!)
      if (sensorData && rule.trigger.sensorId && rule.trigger.threshold) {
        triggerMet = sensorData[rule.trigger.sensorId] > rule.trigger.threshold
      }
      break
    case 'time':
      // Check schedule
      break
    case 'manual':
      triggerMet = true
      break
  }
  
  if (!triggerMet) return false
  
  // Evaluate conditions
  for (const condition of rule.conditions) {
    const deviceState = deviceData.get(condition.deviceId!)
    if (!deviceState) return false
    
    const value = deviceState[condition.sensorId!]
    switch (condition.operator) {
      case '>': if (!(value > condition.value)) return false; break
      case '<': if (!(value < condition.value)) return false; break
      case '=': if (!(value === condition.value)) return false; break
      case '>=': if (!(value >= condition.value)) return false; break
      case '<=': if (!(value <= condition.value)) return false; break
    }
  }
  
  return true
}
```

## Best Practices

1. Use secure protocols for device communication
2. Implement device authentication
3. Regular firmware updates for security patches
4. Monitor device health and connectivity
5. Use edge computing for real-time decisions
6. Implement failover mechanisms
7. Log all device interactions
8. Use encryption for sensitive data
9. Regular backup of device configurations
10. Plan for device lifecycle management