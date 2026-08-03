---
name: text-to-speech
description: Text-to-speech synthesis. Covers voice selection, SSML, prosody control, multi-language TTS, audio generation.
---

# Text-to-Speech

## When to Apply
Use this skill when generating speech from text, creating voiceovers, implementing accessibility features, or building audio content.

## Core Concepts
- Voice Selection: Different voices, styles, and accents
- SSML: Speech Synthesis Markup Language for control
- Prosody: Rate, pitch, volume, emphasis
- Multi-language: Supporting various languages
- Audio Generation: Formats, quality, streaming
- Naturalness: Human-like speech quality
- Emotion: Expressive speech synthesis
- Customization: Training custom voices

## Implementation
```python
# OpenAI Text-to-Speech
import openai

client = openai.OpenAI()

# Generate speech
response = client.audio.speech.create(
    model="tts-1-hd",
    voice="alloy",
    input="Hello, welcome to our application.",
    response_format="mp3"
)

response.stream_to_file("output.mp3")

# SSML control
ssml = """
<speak>
  <prosody rate="slow" pitch="+10%">
    This is slow speech with higher pitch.
  </prosody>
  
  <break time="500ms"/>
  
  <emphasis level="strong">Important announcement</emphasis>
  
  <say-as interpret-as="date" format="mdy">01/15/2024</say-as>
</speak>
"""

# Multi-language TTS
def generate_multilingual(text, language="en"):
    voices = {
        "en": "alloy",
        "es": "echo",
        "fr": "fable",
        "de": "onyx"
    }
    
    response = client.audio.speech.create(
        model="tts-1",
        voice=voices.get(language, "alloy"),
        input=text
    )
    return response

# Audio generation with metadata
def generate_audio_with_metadata(text, output_path):
    response = client.audio.speech.create(
        model="tts-1-hd",
        voice="nova",
        input=text,
        response_format="opus"  # Better compression
    )
    
    with open(output_path, "wb") as f:
        f.write(response.content)
```

## Best Practices
- Choose appropriate voice for the context
- Use SSML for fine-grained control
- Test with different content types
- Consider accessibility requirements
- Provide audio download options
- Cache generated audio when possible
- Handle long text with chunking
- Test across different playback devices
- Consider bandwidth and file size
- Use appropriate audio format (MP3 for compatibility, Opus for size)
- Document voice options and capabilities
- Provide fallback text for audio-only content