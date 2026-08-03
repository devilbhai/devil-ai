---
name: embedding-manager
description: Embedding model management. Model selection, batch processing, caching, quality evaluation.
---

# Embedding Manager

## When to Apply
Use this skill when implementing, selecting, or optimizing embedding models for vector search, semantic similarity, RAG systems, or recommendation engines.

## Core Concepts
- **Model Selection**: OpenAI text-embedding-3, Cohere embed-v3, BGE, E5, Jina, nomic-embed, local models
- **Dimensionality**: 384/512/768/1024/1536/3072 dimensions, dimension reduction techniques
- **Batch Processing**: Chunking large documents, parallel embedding, rate limiting, retry logic
- **Caching**: Semantic cache invalidation, embedding storage, deduplication strategies
- **Quality Evaluation**: Retrieval benchmarks, MTEB scores, domain-specific evaluation
- **Vector Databases**: Pinecone, Weaviate, Qdrant, Milvus, pgvector, Chroma
- **Similarity Metrics**: Cosine, dot product, Euclidean distance, metric selection

## Implementation
```python
import numpy as np
from openai import OpenAI
from typing import List, Optional
import hashlib
import json

class EmbeddingManager:
    def __init__(self, model: str = "text-embedding-3-small"):
        self.client = OpenAI()
        self.model = model
        self.cache = {}  # Use Redis in production

    def embed(self, texts: List[str], dimensions: Optional[int] = None) -> np.ndarray:
        cache_key = self._cache_key(texts)
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Batch in groups of 100 (API limit)
        all_embeddings = []
        for i in range(0, len(texts), 100):
            batch = texts[i:i + 100]
            response = self.client.embeddings.create(
                model=self.model,
                input=batch,
                dimensions=dimensions
            )
            all_embeddings.extend([e.embedding for e in response.data])

        embeddings = np.array(all_embeddings)
        self.cache[cache_key] = embeddings
        return embeddings

    def embed_with_retry(self, texts: List[str], max_retries: int = 3) -> np.ndarray:
        for attempt in range(max_retries):
            try:
                return self.embed(texts)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                wait_time = 2 ** attempt
                print(f"Retry {attempt + 1} after {wait_time}s: {e}")
                time.sleep(wait_time)

    def _cache_key(self, texts: List[str]) -> str:
        content = json.dumps(sorted(texts))
        return hashlib.sha256(content.encode()).hexdigest()

    def batch_embed_documents(
        self,
        documents: List[dict],
        text_field: str = "content",
        batch_size: int = 50
    ) -> List[dict]:
        results = []
        texts = [doc[text_field] for doc in documents]

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            embeddings = self.embed(batch_texts)

            for j, embedding in enumerate(embeddings):
                results.append({
                    **documents[i + j],
                    "embedding": embedding.tolist()
                })

        return results

def select_embedding_model(
    use_case: str,
    max_latency_ms: int = 100,
    max_cost_per_1m_tokens: float = 0.1
) -> str:
    models = {
        "text-embedding-3-small": {
            "dimensions": 1536,
            "cost_per_1m": 0.02,
            "latency_ms": 50,
            "quality": "good"
        },
        "text-embedding-3-large": {
            "dimensions": 3072,
            "cost_per_1m": 0.13,
            "latency_ms": 80,
            "quality": "excellent"
        },
        "nomic-embed-text-v1.5": {
            "dimensions": 768,
            "cost_per_1m": 0.0,
            "latency_ms": 30,
            "quality": "good"
        },
    }

    for name, specs in models.items():
        if specs["latency_ms"] <= max_latency_ms and specs["cost_per_1m"] <= max_cost_per_1m_tokens:
            return name

    return "text-embedding-3-small"
```

## Best Practices
- Use `text-embedding-3-small` for cost-effective production use
- Cache embeddings aggressively — same text should never be embedded twice
- Batch API calls to reduce latency and stay within rate limits
- Store embeddings as `float32` arrays, not `float64`, to save storage
- Use cosine similarity for normalized vectors, dot product for unnormalized
- Evaluate embedding quality on domain-specific datasets, not just MTEB
- Implement retry with exponential backoff for API failures
- Track embedding costs per model and set budget alerts
