---
name: music-generator
description: AI music generation. Composition, arrangement, style transfer, MIDI.
---

# Music Generator

## When to Apply

- When building AI music generation features
- When implementing composition or arrangement tools
- When creating style transfer or MIDI generation
- When working with background music, jingles, or soundtracks

## Core Concepts

- **Composition**: Generate original melodies, harmonies, and rhythms
- **Arrangement**: Layer instruments and structure sections
- **Style Transfer**: Apply musical style from reference tracks
- **MIDI Generation**: Create MIDI data for further editing
- **Mixing**: Balance levels, add effects, master output

## Implementation

```ts
// Music generation request
interface MusicGenerationRequest {
  prompt: string // "upbeat jazz piano trio"
  duration: number // seconds
  bpm: number
  key: string // "C major", "A minor"
  timeSignature: string // "4/4", "3/4"
  instruments: string[]
  style?: string
  mood?: string
  seed?: number
}

// Generated music
interface GeneratedMusic {
  id: string
  audioUrl: string
  midiUrl?: string
  duration: number
  bpm: number
  key: string
  format: "wav" | "mp3" | "midi"
  size: number
  generationTime: number
}

// MIDI track
interface MIDITrack {
  instrument: string
  channel: number
  notes: {
    pitch: number // 0-127
    velocity: number // 0-127
    startTime: number // beats
    duration: number // beats
  }[]
}

// Composition structure
interface Composition {
  sections: {
    type: "intro" | "verse" | "chorus" | "bridge" | "outro"
    startBeat: number
    lengthBeats: number
    tracks: MIDITrack[]
  }[]
  tempo: number
  key: string
}
```

```ts
// Generate music from prompt
async function generateMusic(
  request: MusicGenerationRequest
): Promise<GeneratedMusic> {
  const composition = await aiComposer.compose({
    prompt: request.prompt,
    duration: request.duration,
    bpm: request.bpm,
    key: request.key,
    instruments: request.instruments,
  })
  
  const audio = await renderComposition(composition, {
    sampleRate: 44100,
    format: "wav",
  })
  
  const midiData = compositionToMIDI(composition)
  
  return {
    id: generateId(),
    audioUrl: await saveAudio(audio),
    midiUrl: await saveMIDI(midiData),
    duration: request.duration,
    bpm: request.bpm,
    key: request.key,
    format: "wav",
    size: audio.byteLength,
    generationTime: elapsed(),
  }
}
```

## Best Practices

- Use reference tracks to guide style and mood
- Generate MIDI alongside audio for further editing
- Support loopable output for background music use cases
- Allow fine-tuning of individual instruments after generation
- Provide multiple variations for user selection
- Maintain consistent key and tempo across sections
- Support common export formats (WAV, MP3, MIDI, MusicXML)
- Implement preview generation at lower quality for quick iteration
