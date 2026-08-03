---
name: voice-commands
description: Voice command processing. Speech recognition, command parsing, action execution.
---

# Voice Commands

## When to Apply
Use this skill when implementing voice-driven interfaces, speech-to-text features, or voice command automation.

## Core Concepts
- **Speech recognition**: Web Speech API, Whisper, or cloud ASR
- **Command parsing**: Extract intent and entities from speech text
- **Wake word detection**: Activate on specific trigger phrases
- **Noise filtering**: Ignore background noise and false triggers
- **Multi-language support**: Handle accented or multilingual input

## Implementation
```typescript
// Web Speech API setup
function initSpeechRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = "en-US"
  return recognition
}

// Command parser
interface VoiceCommand {
  pattern: RegExp
  action: (matches: RegExpMatchArray) => void
}

function parseVoiceCommand(
  transcript: string,
  commands: VoiceCommand[]
): VoiceCommand | null {
  const lower = transcript.toLowerCase().trim()
  return commands.find((cmd) => cmd.pattern.test(lower)) ?? null
}

// Example commands
const commands: VoiceCommand[] = [
  { pattern: /open (?:file|document) (.+)/, action: ([, name]) => openFile(name) },
  { pattern: /save (?:this|current)/, action: () => saveCurrent() },
  { pattern: /undo|go back/, action: () => undo() },
]
```

## Best Practices
- Always provide visual feedback when listening
- Show transcribed text before executing commands
- Support confirmation for destructive actions ("Did you say delete?")
- Allow voice commands to be customized per user
- Handle recognition errors gracefully with retry prompts
- Test with various accents, speeds, and noise levels
