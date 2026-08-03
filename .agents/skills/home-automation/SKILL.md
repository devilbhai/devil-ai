---
name: home-automation
description: Home automation. Scene management, device scheduling, energy optimization.
---

# Home Automation

## When to Apply

- Managing smart home devices
- Creating and controlling scenes
- Scheduling device operations
- Optimizing energy consumption
- Monitoring home security

## Core Concepts

- **Scene Management**: Grouping devices for coordinated control
- **Device Scheduling**: Time-based automation
- **Energy Optimization**: Reducing consumption and costs
- **Security Integration**: Cameras, locks, alarms
- **Voice Control**: Integration with voice assistants

## Implementation

```typescript
interface SmartDevice {
  id: string
  name: string
  type: 'light' | 'thermostat' | 'lock' | 'camera' | 'sensor' | 'appliance'
  room: string
  state: Record<string, any>
  isOnline: boolean
  lastUpdated: Date
  energyUsage?: number
}

interface Scene {
  id: string
  name: string
  description: string
  devices: DeviceAction[]
  isActive: boolean
  createdAt: Date
  lastActivated?: Date
}

interface DeviceAction {
  deviceId: string
  action: string
  parameters: Record<string, any>
  delay?: number
}

interface Schedule {
  id: string
  name: string
  deviceId: string
  action: string
  parameters: Record<string, any>
  trigger: ScheduleTrigger
  isActive: boolean
  lastTriggered?: Date
}

interface ScheduleTrigger {
  type: 'time' | 'sunset' | 'sunrise' | 'sensor' | 'geofence'
  time?: string
  days?: string[]
  sensorId?: string
  threshold?: number
}

interface EnergyUsage {
  deviceId: string
  currentUsage: number
  dailyUsage: number
  weeklyUsage: number
  cost: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

function activateScene(scene: Scene, devices: Map<string, SmartDevice>): void {
  scene.devices.forEach((action) => {
    const device = devices.get(action.deviceId)
    if (device) {
      // Apply action with optional delay
      setTimeout(() => {
        device.state = { ...device.state, ...action.parameters }
        device.lastUpdated = new Date()
      }, action.delay || 0)
    }
  })
  
  scene.isActive = true
  scene.lastActivated = new Date()
}

function calculateEnergyOptimization(
  devices: SmartDevice[],
  schedule: Schedule[]
): {
  savings: number
  recommendations: string[]
} {
  let totalSavings = 0
  const recommendations: string[] = []
  
  // Analyze usage patterns
  const highUsageDevices = devices.filter(
    (d) => d.energyUsage && d.energyUsage > 100
  )
  
  highUsageDevices.forEach((device) => {
    if (device.type === 'thermostat') {
      recommendations.push(`Consider adjusting ${device.name} temperature by 1-2 degrees`)
      totalSavings += 15 // Estimated monthly savings
    }
    
    if (device.type === 'light') {
      recommendations.push(`Use dimming or scheduling for ${device.name}`)
      totalSavings += 5
    }
  })
  
  // Check for always-on devices
  const alwaysOn = devices.filter(
    (d) => d.state.power === 'on' && !schedule.some((s) => s.deviceId === d.id))
  )
  
  if (alwaysOn.length > 0) {
    recommendations.push(`${alwaysOn.length} devices are always on - consider scheduling`)
    totalSavings += alwaysOn.length * 10
  }
  
  return { savings: totalSavings, recommendations }
}

function createAutomationRule(
  trigger: string,
  conditions: string[],
  actions: string[]
): string {
  // Simple rule generation
  return `WHEN ${trigger} IF ${conditions.join(' AND ')} THEN ${actions.join(' AND ')}`
}
```

## Best Practices

1. Start with simple automations and expand gradually
2. Use scenes for coordinated device control
3. Schedule devices to reduce energy consumption
4. Monitor energy usage regularly
5. Integrate security devices with automation
6. Use voice control for convenience
7. Regularly update device firmware
8. Backup automation configurations
9. Test automations before relying on them
10. Consider user habits when creating schedules