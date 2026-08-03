---
name: powerpoint-reader
description: PowerPoint processing. PPTX parsing, slide extraction, content analysis.
---

# PowerPoint Reader

## When to Apply
Use this skill when parsing, extracting content from, or analyzing Microsoft PowerPoint (.pptx) presentations, including slide text extraction, image extraction, chart data parsing, and content summarization.

## Core Concepts
- **PPTX Structure**: XML-based format, slide XML, slide layouts, themes, relationships
- **Slide Content**: Text boxes, shapes, tables, charts, images, SmartArt, notes
- **Layout Analysis**: Title slides, content slides, comparison slides, section headers
- **Metadata**: Presentation properties, author, creation date, slide dimensions
- **Libraries**: python-pptx (Python), pptx (Node.js), Open XML SDK (.NET)
- **Image Extraction**: Embedded images, background images, media relationships
- **Chart Data**: Embedded chart data, series, categories, values

## Implementation
```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE_TYPE
from typing import List, Dict, Optional
import json

class PowerPointReader:
    def __init__(self, file_path: str):
        self.prs = Presentation(file_path)
        self.file_path = file_path

    def extract_all_content(self) -> List[Dict]:
        slides = []
        for slide_num, slide in enumerate(self.prs.slides, 1):
            slide_content = {
                "slide_number": slide_num,
                "title": self._extract_title(slide),
                "content": self._extract_slide_text(slide),
                "notes": self._extract_notes(slide),
                "images": self._extract_slide_images(slide),
                "tables": self._extract_slide_tables(slide),
                "charts": self._extract_slide_charts(slide),
                "layout": slide.slide_layout.name if slide.slide_layout else None
            }
            slides.append(slide_content)
        return slides

    def _extract_title(self, slide) -> Optional[str]:
        for shape in slide.shapes:
            if shape.has_text_frame:
                if shape.is_placeholder:
                    if shape.placeholder_format.idx == 0:  # Title placeholder
                        return shape.text_frame.text
        return None

    def _extract_slide_text(self, slide) -> List[Dict]:
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        level = paragraph.level or 0
                        texts.append({
                            "text": text,
                            "level": level,
                            "is_bold": any(run.font.bold for run in paragraph.runs if run.font.bold),
                            "font_size": str(paragraph.runs[0].font.size)
                            if paragraph.runs and paragraph.runs[0].font.size
                            else None
                        })
        return texts

    def _extract_notes(self, slide) -> Optional[str]:
        if slide.has_notes_slide:
            notes_frame = slide.notes_slide.notes_text_frame
            return notes_frame.text if notes_frame.text else None
        return None

    def _extract_slide_tables(self, slide) -> List[List[List[str]]]:
        tables = []
        for shape in slide.shapes:
            if shape.has_table:
                table_data = []
                for row in shape.table.rows:
                    row_data = [cell.text.strip() for cell in row.cells]
                    table_data.append(row_data)
                tables.append(table_data)
        return tables

    def _extract_slide_charts(self, slide) -> List[Dict]:
        charts = []
        for shape in slide.shapes:
            if shape.has_chart:
                chart = shape.chart
                chart_data = {
                    "chart_type": str(chart.chart_type),
                    "series": [],
                    "categories": []
                }

                if chart.has_legend:
                    chart_data["categories"] = [
                        cat.text for cat in chart.category_axis.category_labels
                    ] if chart.category_axis else []

                for series in chart.series:
                    series_data = {
                        "name": series.format.line.color.rgb
                        if series.format.line.color.rgb
                        else "Unknown",
                        "values": [str(v) for v in series.values]
                    }
                    chart_data["series"].append(series_data)

                charts.append(chart_data)
        return charts

    def _extract_slide_images(self, slide) -> List[Dict]:
        images = []
        for shape in slide.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                image = shape.image
                images.append({
                    "content_type": image.content_type,
                    "data": image.blob,
                    "width": shape.width,
                    "height": shape.height
                })
        return images

    def extract_metadata(self) -> Dict:
        props = self.prs.core_properties
        return {
            "author": props.author,
            "title": props.title,
            "subject": props.subject,
            "created": str(props.created) if props.created else None,
            "modified": str(props.modified) if props.modified else None,
            "revision": props.revision,
            "total_slides": len(self.prs.slides),
            "slide_width": self.prs.slide_width,
            "slide_height": self.prs.slide_height
        }

    def to_markdown(self) -> str:
        metadata = self.extract_metadata()
        lines = [f"# {metadata.get('title', 'Presentation')}\n"]

        if metadata.get('author'):
            lines.append(f"**Author**: {metadata['author']}")
        lines.append(f"**Total Slides**: {metadata['total_slides']}")
        lines.append("---\n")

        for slide_content in self.extract_all_content():
            lines.append(f"## Slide {slide_content['slide_number']}")

            if slide_content.get('title'):
                lines.append(f"### {slide_content['title']}")

            for text_item in slide_content.get('content', []):
                indent = "  " * text_item.get('level', 0)
                lines.append(f"{indent}- {text_item['text']}")

            for table in slide_content.get('tables', []):
                if table:
                    header = "| " + " | ".join(table[0]) + " |"
                    separator = "| " + " | ".join(["---"] * len(table[0])) + " |"
                    body = '\n'.join([
                        "| " + " | ".join(row) + " |"
                        for row in table[1:]
                    ])
                    lines.append(f"\n{header}\n{separator}\n{body}")

            if slide_content.get('notes'):
                lines.append(f"\n> **Speaker Notes**: {slide_content['notes']}")

            lines.append("")

        return '\n'.join(lines)

    def summarize(self, llm_client) -> str:
        content = self.to_markdown()
        response = llm_client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "system",
                "content": "Summarize this presentation concisely. Include key points, main arguments, and conclusions."
            }, {
                "role": "user",
                "content": content[:8000]
            }]
        )
        return response.choices[0].message.content

# Usage
reader = PowerPointReader("presentation.pptx")
print(reader.to_markdown())
print(json.dumps(reader.extract_metadata(), indent=2))
```

## Best Practices
- Extract text from all shapes — text boxes, placeholders, tables, and SmartArt
- Preserve slide structure and layout information for context
- Extract speaker notes separately — they often contain critical context
- Handle charts by extracting data series and categories
- Convert to Markdown for LLM processing — preserve slide numbering
- Extract images separately and store with slide references
- Use python-pptx for Python, pptxgenjs for Node.js generation
- Validate PPTX files before processing — check ZIP structure and required parts
