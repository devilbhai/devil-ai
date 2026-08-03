---
name: video-reader
description: Video content analysis. Frame extraction, scene detection, content indexing.
---

# Video Reader

## When to Apply
Use this skill when processing video content for analysis, indexing, transcription, or content extraction, including frame extraction, scene detection, audio processing, and metadata analysis.

## Core Concepts
- **Frame Extraction**: Keyframe extraction, sampling strategies, thumbnail generation, scene change detection
- **Scene Detection**: Shot boundary detection, scene segmentation, content-aware splitting
- **Audio Processing**: Speech-to-text transcription, audio feature extraction, music detection
- **Metadata Extraction**: Video codec, resolution, duration, fps, bitrate, embedded metadata
- **Content Analysis**: Object detection, OCR on frames, face detection, visual similarity
- **Libraries**: OpenCV (Python), FFmpeg, Whisper (OpenAI), pyannote (diarization), torch/tensorflow
- **Storage**: Frame storage strategies, thumbnail generation, index organization

## Implementation
```python
import cv2
import subprocess
import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from pathlib import Path
import numpy as np

@dataclass
class VideoFrame:
    timestamp: float
    frame_number: int
    image_path: str
    scene_id: Optional[int] = None

@dataclass
class VideoScene:
    scene_id: int
    start_time: float
    end_time: float
    keyframe_path: str
    description: Optional[str] = None

class VideoReader:
    def __init__(self, video_path: str, output_dir: str = "./frames"):
        self.video_path = video_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cap = cv2.VideoCapture(video_path)

    def get_metadata(self) -> Dict:
        metadata = {
            "fps": self.cap.get(cv2.CAP_PROP_FPS),
            "frame_count": int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "width": int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "duration_seconds": self.cap.get(cv2.CAP_PROP_FRAME_COUNT)
                / self.cap.get(cv2.CAP_PROP_FPS)
        }

        # Get codec info with ffprobe
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_format", "-show_streams", self.video_path],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            probe_data = json.loads(result.stdout)
            metadata["codec"] = probe_data.get("streams", [{}])[0].get("codec_name")
            metadata["bitrate"] = probe_data.get("format", {}).get("bit_rate")
            metadata["format"] = probe_data.get("format", {}).get("format_name")

        return metadata

    def extract_frames_at_interval(
        self, interval_seconds: float = 1.0
    ) -> List[VideoFrame]:
        frames = []
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps * interval_seconds)

        frame_num = 0
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break

            if frame_num % frame_interval == 0:
                timestamp = frame_num / fps
                image_path = self.output_dir / f"frame_{frame_num:06d}.jpg"
                cv2.imwrite(str(image_path), frame)

                frames.append(VideoFrame(
                    timestamp=timestamp,
                    frame_number=frame_num,
                    image_path=str(image_path)
                ))

            frame_num += 1

        self.cap.release()
        return frames

    def detect_scenes(
        self, threshold: float = 30.0
    ) -> List[VideoScene]:
        scenes = []
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        prev_frame = None
        scene_start = 0
        scene_id = 0

        frame_num = 0
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break

            # Convert to grayscale for comparison
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            if prev_frame is not None:
                # Calculate frame difference
                diff = cv2.absdiff(prev_frame, gray)
                mean_diff = np.mean(diff)

                if mean_diff > threshold:
                    # Scene change detected
                    end_time = frame_num / fps
                    keyframe_path = self.output_dir / f"scene_{scene_id}_keyframe.jpg"
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, scene_start)
                    ret, keyframe = self.cap.read()
                    if ret:
                        cv2.imwrite(str(keyframe_path), keyframe)

                    scenes.append(VideoScene(
                        scene_id=scene_id,
                        start_time=scene_start / fps,
                        end_time=end_time,
                        keyframe_path=str(keyframe_path)
                    ))

                    scene_id += 1
                    scene_start = frame_num

            prev_frame = gray
            frame_num += 1

        # Add final scene
        if scene_start < frame_num:
            keyframe_path = self.output_dir / f"scene_{scene_id}_keyframe.jpg"
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, scene_start)
            ret, keyframe = self.cap.read()
            if ret:
                cv2.imwrite(str(keyframe_path), keyframe)

            scenes.append(VideoScene(
                scene_id=scene_id,
                start_time=scene_start / fps,
                end_time=frame_num / fps,
                keyframe_path=str(keyframe_path)
            ))

        self.cap.release()
        return scenes

    def extract_audio(self, output_path: str = None) -> str:
        if output_path is None:
            output_path = str(self.output_dir / "audio.wav")

        subprocess.run([
            "ffmpeg", "-i", self.video_path,
            "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1",
            output_path, "-y"
        ], check=True)

        return output_path

    def extract_keyframes_by_scene(self) -> List[Dict]:
        scenes = self.detect_scenes()
        keyframes = []

        for scene in scenes:
            self.cap.set(cv2.CAP_PROP_POS_MSEC, scene.start_time * 1000)
            ret, frame = self.cap.read()
            if ret:
                keyframe_path = self.output_dir / f"keyframe_scene_{scene.scene_id}.jpg"
                cv2.imwrite(str(keyframe_path), frame)
                keyframes.append({
                    "scene_id": scene.scene_id,
                    "start_time": scene.start_time,
                    "end_time": scene.end_time,
                    "duration": scene.end_time - scene.start_time,
                    "keyframe_path": str(keyframe_path)
                })

        self.cap.release()
        return keyframes

    def generate_thumbnail_grid(
        self, num_thumbnails: int = 12
    ) -> str:
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        interval = total_frames // num_thumbnails

        thumbnails = []
        for i in range(num_thumbnails):
            frame_num = i * interval
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = self.cap.read()
            if ret:
                resized = cv2.resize(frame, (160, 90))
                thumbnails.append(resized)

        self.cap.release()

        # Create grid
        if not thumbnails:
            return ""

        rows = (num_thumbnails + 3) // 4
        cols = min(4, num_thumbnails)
        grid = np.zeros((rows * 90, cols * 160, 3), dtype=np.uint8)

        for idx, thumb in enumerate(thumbnails):
            row = idx // cols
            col = idx % cols
            grid[row*90:(row+1)*90, col*160:(col+1)*160] = thumb

        grid_path = str(self.output_dir / "thumbnail_grid.jpg")
        cv2.imwrite(grid_path, grid)
        return grid_path

def transcribe_video(video_path: str, whisper_model=None) -> Dict:
    import whisper

    if whisper_model is None:
        whisper_model = whisper.load_model("base")

    result = whisper_model.transcribe(video_path)
    return {
        "text": result["text"],
        "segments": [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"]
            }
            for seg in result["segments"]
        ],
        "language": result.get("language", "unknown")
    }

# Usage
reader = VideoReader("video.mp4")
print(json.dumps(reader.get_metadata(), indent=2))
scenes = reader.detect_scenes()
transcription = transcribe_video("video.mp4")
```

## Best Practices
- Use keyframe extraction instead of uniform sampling for better content representation
- Detect scenes before extracting frames — scenes provide natural content boundaries
- Extract audio separately for transcription — video frame analysis and audio are independent
- Use Whisper for speech-to-text with word-level timestamps
- Store frames with timestamp metadata for time-based queries
- Generate thumbnail grids for visual overview of long videos
- Use scene detection thresholds tuned to your content type (lecture vs action)
- Process video in chunks for memory efficiency with long files
