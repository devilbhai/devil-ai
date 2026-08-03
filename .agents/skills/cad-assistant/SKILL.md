---
name: cad-assistant
description: CAD assistance. Drawing tools, dimension management, file conversion.
---

# CAD Assistant

## When to Apply

- Creating technical drawings
- Managing dimensions and constraints
- Converting between CAD formats
- Analyzing geometric properties
- Generating documentation

## Core Concepts

- **Drawing Tools**: Lines, arcs, circles, polygons
- **Dimension Management**: Annotations, constraints, tolerances
- **File Conversion**: Between DXF, DWG, STEP, IGES
- **Geometric Analysis**: Area, volume, intersections
- **Parametric Design**: Variable-driven models

## Implementation

```typescript
interface Drawing {
  id: string
  name: string
  layers: Layer[]
  entities: Entity[]
  dimensions: Dimension[]
  units: 'mm' | 'cm' | 'm' | 'in' | 'ft'
  scale: number
  createdAt: Date
  modifiedAt: Date
}

interface Layer {
  id: string
  name: string
  color: string
  linetype: string
  linewidth: number
  isVisible: boolean
  isLocked: boolean
}

interface Entity {
  id: string
  type: 'line' | 'arc' | 'circle' | 'polygon' | 'text' | 'dimension'
  layerId: string
  properties: Record<string, any>
  transform: Transform
}

interface Dimension {
  id: string
  entityId: string
  type: 'linear' | 'angular' | 'radius' | 'diameter'
  value: number
  tolerance?: { upper: number; lower: number }
  position: { x: number; y: number }
  text: string
}

interface Transform {
  position: { x: number; y: number; z: number }
  rotation: number
  scale: { x: number; y: number; z: number }
}

function createLine(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  layerId: string
): Entity {
  return {
    id: crypto.randomUUID(),
    type: 'line',
    layerId,
    properties: {
      startX,
      startY,
      endX,
      endY,
    },
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      scale: { x: 1, y: 1, z: 1 },
    },
  }
}

function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  )
}

function convertUnits(
  value: number,
  from: string,
  to: string
): number {
  const conversions: Record<string, Record<string, number>> = {
    mm: { cm: 0.1, m: 0.001, in: 0.03937, ft: 0.003281 },
    cm: { mm: 10, m: 0.01, in: 0.3937, ft: 0.03281 },
    m: { mm: 1000, cm: 100, in: 39.37, ft: 3.281 },
    in: { mm: 25.4, cm: 2.54, m: 0.0254, ft: 0.08333 },
    ft: { mm: 304.8, cm: 30.48, m: 0.3048, in: 12 },
  }
  
  if (from === to) return value
  return value * conversions[from][to]
}

function generateDimensionText(
  dimension: Dimension,
  precision: number = 2
): string {
  const value = dimension.value.toFixed(precision)
  
  if (dimension.tolerance) {
    const upper = dimension.tolerance.upper.toFixed(precision)
    const lower = dimension.tolerance.lower.toFixed(precision)
    return `${value} +${upper}/-${lower}`
  }
  
  return value
}
```

## Best Practices

1. Use layers to organize drawing elements
2. Apply consistent dimensioning standards
3. Use parametric constraints for flexibility
4. Regularly save and backup drawings
5. Use appropriate units for the project
6. Validate geometry before finalizing
7. Generate documentation automatically
8. Optimize drawings for performance
9. Use standard templates and blocks
10. Review drawings with colleagues