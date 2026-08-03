---
name: scanner-manager
description: Scanner integration. Device detection, scan settings, image processing.
---

# Scanner Manager

## When to Apply
Use this skill when integrating scanner hardware, managing scan workflows, or processing scanned images.

## Core Concepts
- **Device discovery**: TWAIN, WIA, SANE driver detection
- **Scan settings**: Resolution, color mode, crop area, duplex
- **Image processing**: Deskew, crop, despeckle, OCR
- **Scan profiles**: Preset configurations for common use cases
- **File output**: PDF, TIFF, JPEG with configurable compression

## Implementation
```typescript
// Scanner device interface
interface ScannerDevice {
  id: string
  name: string
  status: "ready" | "busy" | "offline"
  capabilities: ScanCapabilities
}

interface ScanCapabilities {
  resolutions: number[]
  colorModes: ("color" | "grayscale" | "bw")[]
  supportsDuplex: boolean
  maxWidth: number
  maxHeight: number
}

// Scan job configuration
interface ScanJob {
  deviceId: string
  resolution: number
  colorMode: "color" | "grayscale" | "bw"
  duplex: boolean
  format: "pdf" | "tiff" | "jpeg"
  cropArea?: { x: number; y: number; width: number; height: number }
}

// Process scanned image
function processScan(imageBuffer: Buffer, options: {
  deskew?: boolean
  despeckle?: boolean
  crop?: boolean
}): Buffer {
  let result = imageBuffer
  if (options.deskew) result = deskewImage(result)
  if (options.despeckle) result = despeckleImage(result)
  if (options.crop) result = autoCrop(result)
  return result
}
```

## Best Practices
- Detect available scanners before showing scan UI
- Provide preview scan before final high-resolution scan
- Save scan profiles for repeatable workflows
- Support batch scanning with automatic document feeder
- Validate scanned images for quality (blur detection, skew angle)
- Store scan metadata (device, settings, timestamp) with output files
