---
name: face-detection
description: Face detection and recognition. Face finding, landmark detection, identity verification.
---

# Face Detection

## When to Apply

- When building face detection or recognition features
- When implementing facial landmark detection
- When creating identity verification or authentication
- When working with face-based analytics or emotion detection

## Core Concepts

- **Face Detection**: Find face regions in images/video frames
- **Landmark Detection**: Identify facial features (eyes, nose, mouth, jawline)
- **Face Recognition**: Match detected faces to known identities
- **Liveness Detection**: Distinguish real faces from photos/masks
- **Emotion Detection**: Infer facial expressions and emotions

## Implementation

```ts
// Detected face
interface DetectedFace {
  id: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  landmarks: FaceLandmarks
  embedding: number[] // face encoding vector
  attributes: {
    age?: number
    gender?: string
    emotion?: string
    glasses?: boolean
    mask?: boolean
  }
}

// Facial landmarks (68-point model)
interface FaceLandmarks {
  jawline: Point[]
  leftEyebrow: Point[]
  rightEyebrow: Point[]
  nose: Point[]
  leftEye: Point[]
  rightEye: Point[]
  outerLip: Point[]
  innerLip: Point[]
}

interface Point { x: number; y: number }

// Identity verification result
interface VerificationResult {
  faceId: string
  identityId: string | null
  confidence: number
  verified: boolean
  threshold: number
}
```

```ts
// Detect and recognize face
async function detectAndRecognize(
  image: ImageData,
  identityDB: IdentityDatabase
): Promise<DetectedFace[]> {
  const faces = await faceDetector.detect(image)
  
  return Promise.all(faces.map(async (face) => {
    const embedding = await faceEncoder.encode(face)
    const match = await identityDB.findMatch(embedding, { threshold: 0.6 })
    return { ...face, embedding, identityId: match?.id ?? null }
  }))
}
```

## Best Practices

- Use face detection before recognition to reduce false positives
- Store face embeddings, not raw images, for privacy
- Implement anti-spoofing measures for authentication use cases
- Handle multi-face scenarios in group photos
- Account for lighting, angle, and occlusion variations
- Set appropriate confidence thresholds for different use cases
- Comply with biometric data regulations (GDPR, BIPA)
- Provide fallback authentication when face recognition fails
