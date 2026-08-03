---
name: route-optimizer
description: Route optimization. Multi-stop routing, traffic consideration, fuel optimization.
---

# Route Optimizer

## When to Apply

- Planning multi-stop delivery routes
- Optimizing travel routes for efficiency
- Considering traffic patterns and conditions
- Minimizing fuel consumption
- Managing fleet logistics

## Core Concepts

- **Multi-stop Routing**: Optimizing order of multiple destinations
- **Traffic Analysis**: Real-time and historical traffic data
- **Fuel Optimization**: Distance, speed, and load considerations
- **Time Windows**: Delivery or appointment scheduling constraints
- **Vehicle Capacity**: Load planning and weight distribution

## Implementation

```typescript
interface Route {
  id: string
  name: string
  stops: Stop[]
  totalDistance: number
  estimatedTime: number
  fuelCost: number
  optimizedOrder: number[]
}

interface Stop {
  id: string
  name: string
  address: string
  coordinates: { lat: number; lng: number }
  timeWindow?: { start: Date; end: Date }
  duration: number
  priority: number
}

interface TrafficCondition {
  segment: string
  severity: number
  delay: number
  alternative?: string
}

function optimizeRoute(stops: Stop[], vehicleCapacity: number): Route {
  // Simple nearest neighbor algorithm
  const optimizedOrder: number[] = []
  const visited = new Set<number>()
  let currentIndex = 0
  
  optimizedOrder.push(currentIndex)
  visited.add(currentIndex)
  
  while (visited.size < stops.length) {
    let nearestIndex = -1
    let nearestDistance = Infinity
    
    for (let i = 0; i < stops.length; i++) {
      if (!visited.has(i)) {
        const distance = calculateDistance(
          stops[currentIndex].coordinates,
          stops[i].coordinates
        )
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }
    }
    
    if (nearestIndex !== -1) {
      optimizedOrder.push(nearestIndex)
      visited.add(nearestIndex)
      currentIndex = nearestIndex
    }
  }
  
  const totalDistance = calculateTotalDistance(stops, optimizedOrder)
  const estimatedTime = calculateEstimatedTime(stops, optimizedOrder)
  
  return {
    id: crypto.randomUUID(),
    name: 'Optimized Route',
    stops,
    totalDistance,
    estimatedTime,
    fuelCost: calculateFuelCost(totalDistance),
    optimizedOrder,
  }
}

function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  // Haversine formula for distance between two points
  const R = 6371 // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

## Best Practices

1. Consider traffic patterns during different times of day
2. Group stops by geographic clusters
3. Account for vehicle capacity and weight distribution
4. Plan for rest stops and driver breaks
5. Use real-time traffic data for dynamic routing
6. Optimize for fuel efficiency, not just distance
7. Consider time windows for deliveries
8. Have backup routes for road closures
9. Track actual vs. planned routes for improvement
10. Use GPS tracking for fleet management