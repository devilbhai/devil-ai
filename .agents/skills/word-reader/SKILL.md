---
name: word-reader
description: Word document processing. DOCX parsing, content extraction, format conversion.
---

# Word Reader

## When to Apply
Use this skill when parsing, extracting content from, or converting Microsoft Word (.docx) documents, including text extraction, table parsing, image extraction, and format conversion.

## Core Concepts
- **DOCX Structure**: XML-based format, document.xml, styles.xml, relationships, content types
- **Text Extraction**: Paragraphs, runs, text formatting, tables, lists, headers/footers
- **Table Parsing**: Cell extraction, merged cells, table formatting, nested tables
- **Metadata**: Author, creation date, revision history, document properties
- **Format Conversion**: DOCX to Markdown, HTML, plain text, PDF
- **Libraries**: python-docx (Python), docx (Node.js), Open XML SDK (.NET), Apache POI (Java)
- **Image Extraction**: Embedded images, charts, diagrams, media relationships

## Implementation
```python
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
import json
import re

class WordReader:
    def __init__(self, file_path: str):
        self.doc = Document(file_path)
        self.file_path = file_path

    def extract_full_text(self) -> str:
        return '\n\n'.join([
            self._extract_paragraph(p) for p in self.doc.paragraphs
            if p.text.strip()
        ])

    def _extract_paragraph(self, paragraph: Paragraph) -> str:
        text = paragraph.text
        style = paragraph.style.name

        if style.startswith('Heading'):
            level = style.replace('Heading ', '')
            return f"{'#' * int(level)} {text}"
        elif style == 'List Bullet':
            return f"- {text}"
        elif style == 'List Number':
            return f"1. {text}"
        return text

    def extract_tables(self) -> List[List[List[str]]]:
        tables = []
        for table in self.doc.tables:
            table_data = []
            for row in table.rows:
                row_data = [cell.text.strip() for cell in row.cells]
                table_data.append(row_data)
            tables.append(table_data)
        return tables

    def extract_formatted_text(self) -> List[Dict]:
        content = []
        for paragraph in self.doc.paragraphs:
            if not paragraph.text.strip():
                continue

            runs = []
            for run in paragraph.runs:
                runs.append({
                    "text": run.text,
                    "bold": run.bold,
                    "italic": run.italic,
                    "underline": run.underline,
                    "font_size": str(run.font.size) if run.font.size else None,
                    "color": str(run.font.color.rgb) if run.font.color and run.font.color.rgb else None
                })

            content.append({
                "type": "paragraph",
                "style": paragraph.style.name,
                "runs": runs,
                "alignment": str(paragraph.alignment) if paragraph.alignment else None
            })

        return content

    def extract_metadata(self) -> Dict:
        props = self.doc.core_properties
        return {
            "author": props.author,
            "title": props.title,
            "subject": props.subject,
            "keywords": props.keywords,
            "created": str(props.created) if props.created else None,
            "modified": str(props.modified) if props.modified else None,
            "revision": props.revision,
            "category": props.category,
            "comments": props.comments
        }

    def to_markdown(self) -> str:
        lines = []
        metadata = self.extract_metadata()

        if metadata.get('title'):
            lines.append(f"# {metadata['title']}")
            lines.append("")

        for element in self.doc.element.body:
            if element.tag.endswith('}p'):
                paragraph = Paragraph(element, self.doc)
                lines.append(self._extract_paragraph(paragraph))
            elif element.tag.endswith('}tbl'):
                table = Table(element, self.doc)
                table_md = self._table_to_markdown(table)
                lines.append(table_md)

        return '\n\n'.join(lines)

    def _table_to_markdown(self, table: Table) -> str:
        rows = []
        for row in table.rows:
            cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            rows.append(cells)

        if not rows:
            return ""

        # Markdown table
        header = "| " + " | ".join(rows[0]) + " |"
        separator = "| " + " | ".join(["---"] * len(rows[0])) + " |"
        body = '\n'.join([
            "| " + " | ".join(row) + " |"
            for row in rows[1:]
        ])

        return f"{header}\n{separator}\n{body}"

    def extract_images(self) -> List[Dict]:
        images = []
        for rel in self.doc.part.rels.values():
            if "image" in rel.reltype:
                image_data = rel.target_part.blob
                images.append({
                    "content_type": rel.target_part.content_type,
                    "data": image_data,
                    "filename": rel.target_ref
                })
        return images

    def to_html(self) -> str:
        html_parts = ['<div class="document">']

        for paragraph in self.doc.paragraphs:
            if not paragraph.text.strip():
                continue

            style = paragraph.style.name
            if style.startswith('Heading'):
                level = style.replace('Heading ', '')
                html_parts.append(f'<h{level}>{paragraph.text}</h{level}>')
            elif style == 'List Bullet':
                html_parts.append(f'<ul><li>{paragraph.text}</li></ul>')
            else:
                html_parts.append(f'<p>{paragraph.text}</p>')

        html_parts.append('</div>')
        return '\n'.join(html_parts)

# Usage
reader = WordReader("document.docx")
print(reader.to_markdown())
print(json.dumps(reader.extract_metadata(), indent=2))
```

## Best Practices
- Preserve document structure (headings, lists, tables) during extraction
- Handle merged cells in tables by checking cell span attributes
- Extract metadata for document provenance and search indexing
- Convert to Markdown for LLM processing — it preserves structure better than plain text
- Handle images separately — extract and store them, don't embed in text output
- Use python-docx for Python, @sparticuz/docx for Node.js, Open XML SDK for .NET
- Validate DOCX files before processing — check ZIP structure and required XML files
- Cache parsed results for large documents to avoid re-parsing on repeated access
