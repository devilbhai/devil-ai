---
name: rag-advanced
description: Advanced RAG - hybrid search, reranking, query expansion, context compression, evaluation.
---

# Advanced RAG

## When to Apply
Use this skill for building advanced RAG systems, optimizing retrieval quality, or implementing complex retrieval patterns.

## Core Concepts
- Hybrid search (dense + sparse)
- Reranking with cross-encoders
- Query expansion and transformation
- Context compression
- Multi-step retrieval
- Parent document retrieval
- Self-RAG and CRAG

## Best Practices
- Evaluate retrieval quality (MRR, Recall@k)
- Use hybrid search for better recall
- Rerank results for precision
- Chunk strategically (semantic, not fixed)
- Cache embeddings and results
- Monitor retrieval metrics
- A/B test retrieval strategies

## Hybrid Search
```python
from langchain.retrievers import EnsembleRetriever

# Dense retrieval
dense_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# Sparse retrieval (BM25)
sparse_retriever = BM25Retriever.from_documents(docs)

# Combine
ensemble = EnsembleRetriever(
    retrievers=[dense_retriever, sparse_retriever],
    weights=[0.6, 0.4]
)
```

## Reranking
```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(query, documents, top_k=5):
    pairs = [(query, doc.page_content) for doc in documents]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked[:top_k]]
```

## Query Transformation
```python
# HyDE - Hypothetical Document Embeddings
def hyde_query(query, llm):
    prompt = f"Write a passage that would answer: {query}"
    hypothetical_doc = llm.generate(prompt)
    return hypothetical_doc

# Multi-Query
def generate_queries(query, llm, n=3):
    prompt = f"Generate {n} different search queries for: {query}"
    return llm.generate(prompt).split("\n")
```

## Evaluation
- MRR (Mean Reciprocal Rank)
- Recall@k
- NDCG
- Faithfulness
- Answer relevancy
- Context relevancy
