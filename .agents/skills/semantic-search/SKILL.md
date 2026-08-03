---
name: semantic-search
description: Semantic search implementation. Query understanding, relevance ranking, result filtering.
---

# Semantic Search

## When to Apply
Use this skill when implementing semantic search systems, including vector similarity search, hybrid search, query expansion, and relevance ranking for knowledge bases, documentation, or content retrieval.

## Core Concepts
- **Query Understanding**: Intent detection, query expansion, synonym resolution, query reformulation
- **Vector Search**: Embedding-based similarity, approximate nearest neighbor (ANN), vector databases
- **Hybrid Search**: Combining keyword (BM25) with semantic (vector) search, reciprocal rank fusion
- **Relevance Ranking**: Cross-encoders for re-ranking, learning to rank, feature scoring
- **Result Filtering**: Metadata filtering, faceted search, threshold-based filtering
- **Query Processing**: Stop word removal, lemmatization, spell correction, multi-language support
- **Evaluation**: Precision@k, recall@k, MRR, NDCG, human evaluation protocols

## Implementation
```python
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class SearchResult:
    id: str
    content: str
    score: float
    metadata: Dict
    source: str  # "vector", "keyword", or "hybrid"

class SemanticSearchEngine:
    def __init__(self, embedding_manager, vector_store, keyword_index):
        self.embedding_manager = embedding_manager
        self.vector_store = vector_store
        self.keyword_index = keyword_index

    def search(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict] = None,
        mode: str = "hybrid"
    ) -> List[SearchResult]:
        if mode == "vector":
            return self._vector_search(query, top_k, filters)
        elif mode == "keyword":
            return self._keyword_search(query, top_k, filters)
        else:
            return self._hybrid_search(query, top_k, filters)

    def _vector_search(
        self, query: str, top_k: int, filters: Optional[Dict]
    ) -> List[SearchResult]:
        query_embedding = self.embedding_manager.embed([query])[0]
        results = self.vector_store.search(
            query_embedding,
            top_k=top_k * 2,  # Over-fetch for filtering
            filters=filters
        )

        return [
            SearchResult(
                id=r["id"],
                content=r["content"],
                score=r["score"],
                metadata=r["metadata"],
                source="vector"
            )
            for r in results[:top_k]
        ]

    def _keyword_search(
        self, query: str, top_k: int, filters: Optional[Dict]
    ) -> List[SearchResult]:
        results = self.keyword_index.search(query, top_k=top_k, filters=filters)

        return [
            SearchResult(
                id=r["id"],
                content=r["content"],
                score=r["score"],
                metadata=r["metadata"],
                source="keyword"
            )
            for r in results
        ]

    def _hybrid_search(
        self, query: str, top_k: int, filters: Optional[Dict]
    ) -> List[SearchResult]:
        vector_results = self._vector_search(query, top_k * 2, filters)
        keyword_results = self._keyword_search(query, top_k * 2, filters)

        # Reciprocal Rank Fusion
        fused_scores = {}
        k = 60  # RRF constant

        for rank, result in enumerate(vector_results):
            fused_scores[result.id] = fused_scores.get(result.id, 0) + 1 / (k + rank + 1)

        for rank, result in enumerate(keyword_results):
            fused_scores[result.id] = fused_scores.get(result.id, 0) + 1 / (k + rank + 1)

        # Sort by fused score
        sorted_ids = sorted(fused_scores.keys(), key=lambda x: fused_scores[x], reverse=True)

        # Merge results
        all_results = {r.id: r for r in vector_results + keyword_results}

        return [
            SearchResult(
                id=result_id,
                content=all_results[result_id].content,
                score=fused_scores[result_id],
                metadata=all_results[result_id].metadata,
                source="hybrid"
            )
            for result_id in sorted_ids[:top_k]
        ]

    def expand_query(self, query: str, llm_client) -> str:
        """Use LLM to expand query with synonyms and related terms."""
        response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": "Expand the search query with relevant synonyms and related terms. Return only the expanded query, nothing else."
            }, {
                "role": "user",
                "content": query
            }],
            max_tokens=100
        )
        return response.choices[0].message.content

    def rerank_with_cross_encoder(
        self, query: str, results: List[SearchResult], cross_encoder
    ) -> List[SearchResult]:
        pairs = [(query, r.content) for r in results]
        scores = cross_encoder.predict(pairs)

        for result, score in zip(results, scores):
            result.score = float(score)

        return sorted(results, key=lambda x: x.score, reverse=True)

def evaluate_search(
    test_queries: List[Dict], search_engine: SemanticSearchEngine
) -> Dict[str, float]:
    metrics = {"precision@5": [], "recall@5": [], "mrr": []}

    for test in test_queries:
        results = search_engine.search(test["query"], top_k=5)
        result_ids = [r.id for r in results]

        # Precision@5
        relevant_in_results = sum(1 for rid in result_ids if rid in test["relevant_ids"])
        metrics["precision@5"].append(relevant_in_results / 5)

        # Recall@5
        metrics["recall@5"].append(
            relevant_in_results / len(test["relevant_ids"]) if test["relevant_ids"] else 0
        )

        # MRR
        for rank, rid in enumerate(result_ids, 1):
            if rid in test["relevant_ids"]:
                metrics["mrr"].append(1 / rank)
                break
        else:
            metrics["mrr"].append(0)

    return {k: np.mean(v) for k, v in metrics.items()}
```

## Best Practices
- Use hybrid search (vector + keyword) for best retrieval quality
- Implement query expansion for short or ambiguous queries
- Use cross-encoder re-ranking for high-precision applications
- Set appropriate similarity thresholds to filter low-quality results
- Cache query embeddings and results for frequently searched terms
- Evaluate search quality with human-labeled test sets, not just automated metrics
- Index metadata alongside embeddings for efficient filtered search
- Monitor and log search queries to identify gaps and improve coverage
