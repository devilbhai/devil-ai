---
name: object-detection
description: Object detection. YOLO, SSD, object tracking, scene understanding.
---

# Object Detection

## When to Apply

- When building object detection features
- When implementing real-time object tracking in video
- When creating scene understanding or counting tools
- When working with surveillance, inventory, or quality inspection

## Core Concepts

- **Detection Models**: YOLO, SSD, Faster R-CNN, EfficientDet
- **Object Tracking**: Assign consistent IDs across video frames (Deep SORT, ByteTrack)
- **Non-Maximum Suppression**: Remove overlapping duplicate detections
- **Anchor-free Detection**: Modern approaches without predefined anchors
- **Scene Understanding**: Relationships between detected objects

## Implementation

```ts
// Detection result
interface DetectionResult {
  frameId?: string
  timestamp?: Date
  objects: DetectedObject[]
  processingTime: number
}

// Object tracker
interface TrackedObject {
  trackId: number
  label: string
  confidence: number
  bbox: BoundingBox
  trajectory: Point[]
  firstSeen: Date
  lastSeen: Date
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// Detection configuration
interface DetectionConfig {
  model: "yolov8" | "yolov5" | "ssd" | "efficientdet"
  confidenceThreshold: number
  nmsThreshold: number
  inputSize: { width: number; height: number }
  classes?: string[] // filter specific classes
  maxDetections?: number
}
```

```ts
// Track objects across frames
class ObjectTracker {
  private tracks: Map<number, TrackedObject> = new Map()
  private nextId = 1

  update(detections: DetectedObject[]): TrackedObject[] {
    const matched = this.matchDetections(detections)
    this.updateExistingTracks(matched)
    this.createTracksForUnmatched(detections)
    this.removeStaleTracks()
    return Array.from(this.tracks.values())
  }

  private matchDetections(detections: DetectedObject[]): MatchResult[] {
    // Use IoU or deep association for matching
    return matchWithHungarianAlgorithm(this.tracks, detections)
  }
}
```

## Best Practices

- Use GPU acceleration for real-time detection
- Apply NMS to remove duplicate detections
- Maintain track consistency across occlusions
- Use appropriate input resolution for accuracy vs speed tradeoff
- Implement confidence-based filtering to reduce false positives
- Support custom model training for domain-specific objects
- Batch frames for throughput in non-real-time scenarios
- Log detection metrics for model performance monitoring
