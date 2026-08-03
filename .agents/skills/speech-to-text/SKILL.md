---
name: speech-to-text
description: Speech-to-text conversion. Covers real-time transcription, command recognition, voice input, noise reduction.
---

# Speech-to-Text

## When to Apply
Use this skill when implementing real-time speech recognition, voice commands, dictation systems, or audio input processing.

## Core Concepts
- Real-time Transcription: Live speech-to-text conversion
- Command Recognition: Voice commands and intent detection
- Voice Input: Microphone capture and processing
- Noise Reduction: Audio preprocessing for clarity
- Streaming: Continuous recognition with buffering
- Language Models: Accuracy vs speed trade-offs
- Custom Vocabulary: Domain-specific terms
- Latency: Response time optimization

## Implementation
```python
# Real-time speech recognition with Whisper
import whisper
import pyaudio
import numpy as np

model = whisper.load_model("base")

# Audio stream setup
p = pyaudio.PyAudio()
stream = p.open(
    format=pyaudio.paFloat32,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=4096
)

# Process audio chunks
while True:
    data = stream.read(4096)
    audio = np.frombuffer(data, dtype=np.float32)
    
    # Transcribe chunk
    result = model.transcribe(audio, language="en")
    print(result["text"])

# Voice command recognition
def recognize_command(audio):
    result = model.transcribe(audio)
    text = result["text"].lower()
    
    if "play" in text:
        return "PLAY_MUSIC"
    elif "stop" in text:
        return "STOP_PLAYBACK"
    elif "volume" in text:
        return "ADJUST_VOLUME"
    
    return "UNKNOWN_COMMAND"

# Noise reduction with noisereduce
import noisereduce as nr

def preprocess_audio(audio_data):
    # Reduce noise
    reduced_noise = nr.reduce_noise(y=audio_data, sr=16000)
    return reduced_noise
```

```javascript
// Browser Web Speech API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const result = event.results[event.results.length - 1];
  if (result.isFinal) {
    console.log('Final:', result[0].transcript);
  } else {
    console.log('Interim:', result[0].transcript);
  }
};

recognition.start();
```

## Best Practices
- Use appropriate sample rate (16kHz for speech)
- Implement noise reduction preprocessing
- Handle silence and pauses gracefully
- Use streaming for real-time applications
- Implement custom vocabulary for domain terms
- Provide visual feedback during recognition
- Handle multiple languages and accents
- Test with various audio quality levels
- Implement error handling for recognition failures
- Cache common phrases for faster response
- Use confidence scores to filter low-quality results
- Provide fallback options when recognition fails