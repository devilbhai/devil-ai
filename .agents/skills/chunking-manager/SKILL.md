---
name: chunking-manager
description: Document chunking strategies. Splitting algorithms, overlap handling, semantic chunking.
---

# Chunking Manager

## When to Apply
Use this skill when implementing document chunking for RAG systems, semantic search, or any system that requires splitting long documents into processable pieces while maintaining context.

## Core Concepts
- **Fixed-Size Chunking**: Character/word/token-based splitting, simple but may break context
- **Recursive Chunking**: Hierarchical splitting by separators (paragraphs, sentences, words)
- **Semantic Chunking**: Embedding-based splitting, topic boundary detection, coherence scoring
- **Overlapping**: Overlap tokens between chunks to preserve context across boundaries
- **Metadata Preservation**: Tracking source, position, section, and document structure in chunks
- **Special Content**: Handling tables, code blocks, lists, headers, and embedded media
- **Evaluation**: Chunk quality metrics, retrieval accuracy, downstream task performance

## Implementation
```python
from typing import List, Dict, Optional
from dataclasses import dataclass
import re

@dataclass
class Chunk:
    content: str
    metadata: Dict
    index: int
    start_pos: int
    end_pos: int

class ChunkingManager:
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separators: Optional[List[str]] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " "]

    def chunk_document(self, text: str, metadata: Optional[Dict] = None) -> List[Chunk]:
        metadata = metadata or {}
        chunks = []
        raw_chunks = self._recursive_split(text, self.separators)

        current_chunk = ""
        chunk_index = 0
        position = 0

        for part in raw_chunks:
            if len(current_chunk) + len(part) <= self.chunk_size:
                current_chunk += part
            else:
                if current_chunk:
                    chunks.append(Chunk(
                        content=current_chunk.strip(),
                        metadata={**metadata, "chunk_index": chunk_index},
                        index=chunk_index,
                        start_pos=position,
                        end_pos=position + len(current_chunk)
                    ))
                    chunk_index += 1
                    # Overlap: keep the last part of current chunk
                    overlap_text = current_chunk[-self.chunk_overlap:] if self.chunk_overlap else ""
                    current_chunk = overlap_text + part
                    position += len(current_chunk) - len(overlap_text)
                else:
                    current_chunk = part

        if current_chunk.strip():
            chunks.append(Chunk(
                content=current_chunk.strip(),
                metadata={**metadata, "chunk_index": chunk_index},
                index=chunk_index,
                start_pos=position,
                end_pos=position + len(current_chunk)
            ))

        return chunks

    def _recursive_split(self, text: str, separators: List[str]) -> List[str]:
        if not separators:
            return [text]

        separator = separators[0]
        remaining_separators = separators[1:]

        if separator in text:
            parts = text.split(separator)
            result = []
            for part in parts:
                if len(part) <= self.chunk_size:
                    result.append(part + separator)
                else:
                    result.extend(self._recursive_split(part, remaining_separators))
            return result

        return self._recursive_split(text, remaining_separators)

    def chunk_by_semantics(self, text: str, embedding_manager) -> List[Chunk]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if len(sentences) <= 3:
            return [Chunk(
                content=text,
                metadata={},
                index=0,
                start_pos=0,
                end_pos=len(text)
            )]

        # Embed all sentences
        embeddings = embedding_manager.embed(sentences)

        # Find semantic boundaries (biggest embedding shifts)
        boundaries = [0]
        for i in range(1, len(embeddings) - 1):
            similarity_before = self._cosine_sim(embeddings[i-1], embeddings[i])
            similarity_after = self._cosine_sim(embeddings[i], embeddings[i+1])
            if similarity_before > similarity_after + 0.1:
                boundaries.append(i)
        boundaries.append(len(sentences))

        # Create chunks from boundaries
        chunks = []
        for i in range(len(boundaries) - 1):
            start = boundaries[i]
            end = boundaries[i + 1]
            chunk_text = ' '.join(sentences[start:end])
            chunks.append(Chunk(
                content=chunk_text,
                metadata={"semantic_chunk": True},
                index=i,
                start_pos=sum(len(s) + 1 for s in sentences[:start]),
                end_pos=sum(len(s) + 1 for s in sentences[:end])
            ))

        return chunks

    def _cosine_sim(self, a, b) -> float:
        import numpy as np
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def chunk_markdown_by_headings(text: str) -> List[Chunk]:
    sections = re.split(r'^(#{1,6}\s+.+)$', text, flags=re.MULTILINE)
    chunks = []
    current_heading = ""
    current_content = ""

    for section in sections:
        if re.match(r'^#{1,6}\s+', section):
            if current_content.strip():
                chunks.append(Chunk(
                    content=f"# {current_heading}\n\n{current_content.strip()}" if current_heading else current_content.strip(),
                    metadata={"heading": current_heading},
                    index=len(chunks),
                    start_pos=0,
                    end_pos=0
                ))
            current_heading = section.strip()
            current_content = ""
        else:
            current_content += section

    if current_content.strip():
        chunks.append(Chunk(
            content=f"# {current_heading}\n\n{current_content.strip()}" if current_heading else current_content.strip(),
            metadata={"heading": current_heading},
            index=len(chunks),
            start_pos=0,
            end_pos=0
        ))

    return chunks
```

## Best Practices
- Choose chunk size based on your embedding model's context window (typically 256-1024 tokens)
- Use 10-20% overlap to preserve context at chunk boundaries
- For RAG, prefer recursive splitting over fixed-size splitting
- Use semantic chunking for high-quality retrieval when processing time allows
- Preserve document structure (headings, lists) as metadata for filtered retrieval
- Test chunk quality by evaluating retrieval precision/recall on sample queries
- Avoid splitting in the middle of sentences, lists, or code blocks
- Store chunk position information for citation and source attribution
