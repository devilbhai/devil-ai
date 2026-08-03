---
name: 3d-model-viewer
description: 3D model viewing. Format support, rendering, interaction, export.
---

# 3D Model Viewer

## When to Apply

- Viewing 3D models in various formats
- Interacting with 3D content
- Rendering models with different materials
- Exporting models to other formats
- Analyzing model properties

## Core Concepts

- **Format Support**: OBJ, FBX, GLTF, STL, 3DS
- **Rendering**: Shaders, materials, lighting
- **Interaction**: Rotation, zoom, pan, selection
- **Animation**: Playback, keyframes, blending
- **Export**: Format conversion, optimization

## Implementation

```typescript
interface Model3D {
  id: string
  name: string
  format: string
  vertices: number
  faces: number
  materials: Material[]
  animations: Animation[]
  boundingBox: BoundingBox
  filePath: string
  fileSize: number
}

interface Material {
  id: string
  name: string
  color: { r: number; g: number; b: number; a: number }
  texture?: string
  normalMap?: string
  metallic: number
  roughness: number
  opacity: number
}

interface Animation {
  id: string
  name: string
  duration: number
  fps: number
  keyframes: Keyframe[]
}

interface Keyframe {
  time: number
  transform: Transform
  values: Record<string, any>
}

interface Transform {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
  scale: { x: number; y: number; z: number }
}

interface BoundingBox {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
  center: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
}

interface ViewerSettings {
  backgroundColor: string
  showGrid: boolean
  showAxes: boolean
  wireframe: boolean
  lighting: 'none' | 'basic' | 'pbr' | 'flat'
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
}

function calculateBoundingBox(vertices: number[][]): BoundingBox {
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  
  for (const vertex of vertices) {
    minX = Math.min(minX, vertex[0])
    minY = Math.min(minY, vertex[1])
    minZ = Math.min(minZ, vertex[2])
    maxX = Math.max(maxX, vertex[0])
    maxY = Math.max(maxY, vertex[1])
    maxZ = Math.max(maxZ, vertex[2])
  }
  
  const min = { x: minX, y: minY, z: minZ }
  const max = { x: maxX, y: maxY, z: maxZ }
  const center = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  }
  const size = {
    x: maxX - minX,
    y: maxY - minY,
    z: maxZ - minZ,
  }
  
  return { min, max, center, size }
}

function optimizeModel(model: Model3D, targetVertices: number): Model3D {
  // Simple vertex reduction (in real implementation, use mesh simplification algorithms)
  const ratio = targetVertices / model.vertices
  
  if (ratio >= 1) return model
  
  return {
    ...model,
    vertices: Math.round(model.vertices * ratio),
    faces: Math.round(model.faces * ratio),
  }
}

function getFormatInfo(format: string): {
  extensions: string[]
  description: string
  features: string[]
} {
  const formats: Record<string, any> = {
    obj: {
      extensions: ['.obj'],
      description: 'Wavefront OBJ format',
      features: ['vertices', 'normals', 'texture coordinates', 'materials'],
    },
    fbx: {
      extensions: ['.fbx'],
      description: 'Autodesk FBX format',
      features: ['geometry', 'materials', 'animations', 'skeletal data'],
    },
    gltf: {
      extensions: ['.gltf', '.glb'],
      description: 'GL Transmission Format',
      features: ['PBR materials', 'animations', 'scene hierarchy'],
    },
    stl: {
      extensions: ['.stl'],
      description: 'STL format for 3D printing',
      features: ['triangulated geometry', 'binary/ASCII'],
    },
  }
  
  return formats[format.toLowerCase()] || formats.obj
}
```

## Best Practices

1. Support multiple 3D file formats
2. Implement efficient rendering with LOD
3. Provide intuitive controls for interaction
4. Optimize models for web viewing
5. Support material and texture editing
6. Implement proper lighting and shadows
7. Allow camera preset positions
8. Provide measurement tools
9. Support animation playback
10. Enable export to common formats