---
name: audio-transcription
description: Audio transcription services. Covers Whisper API, speech-to-text, timestamps, speaker diarization, multi-language support.
---

# Audio Transcription

## When to Apply
Use this skill when transcribing audio files, generating subtitles, creating meeting notes, or processing speech-to-text with timestamps and speaker identification.

## Core Concepts
- Speech-to-Text: Converting audio to written text
- Whisper API: OpenAI's speech recognition model
- Timestamps: Word-level and segment-level timing
- Speaker Diarization: Identifying different speakers
- Multi-language: Supporting various languages and accents
- Formatting: Subtitles (SRT, VTT), plain text, JSON
- Post-processing: Cleaning transcripts, adding punctuation
- Quality: Accuracy, confidence scores, error correction

## Implementation
```python
# OpenAI Whisper API
import openai

client = openai.OpenAI()

# Transcribe audio file
with open("audio.mp3", "rb") as audio_file:
    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"]
    )

print(response.text)
print(response.segments)

# Transcribe with language
response = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    language="en"
)

# Generate subtitles (SRT format)
def generate_srt(segments):
    srt = ""
    for i, segment in enumerate(segments, 1):
        start = format_time(segment['start'])
        end = format_time(segment['end'])
        srt += f"{i}\n{start} --> {end}\n{segment['text']}\n\n"
    return srt

# Batch transcription
import os

def transcribe_directory(directory):
    results = {}
    for filename in os.listdir(directory):
        if filename.endswith(('.mp3', '.wav', '.m4a')):
            with open(os.path.join(directory, filename), "rb") as f:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f
                )
                results[filename] = result.text
    return results
```

## Best Practices
- Use high-quality audio for better accuracy
- Specify language when known for faster processing
- Use verbose_json for timestamps and metadata
- Post-process transcripts for punctuation and formatting
- Handle multiple speakers with diarization
- Store transcripts alongside original files
- Use appropriate output format (SRT for video, text for search)
- Clean audio before transcription when possible
- Validate transcripts against audio manually
- Keep original files for re-processing if needed
- Use batch processing for multiple files
- Document speaker identification for multi-person audio