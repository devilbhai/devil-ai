---
name: rag-builder
description: RAG (Retrieval-Augmented Generation) system building. Covers document chunking, embedding models, vector stores, retrieval strategies, reranking, evaluation metrics.
---

# RAG (Retrieval-Augmented Generation) System Building

## When to Apply

- Building a RAG pipeline from scratch (ingest → chunk → embed → store → retrieve → generate)
- Choosing chunking strategies (fixed-size, recursive, semantic) for document types
- Selecting embedding models (OpenAI, Cohere, open-source) based on use case
- Implementing retrieval strategies (dense, sparse, hybrid) for query answering
- Adding reranking layers to improve precision after initial retrieval
- Evaluating RAG quality with metrics like recall@k, MRR, faithfulness
- Optimizing chunk size, overlap, and retrieval top-k for accuracy vs. latency

## Core Patterns

### Document Chunking

```typescript
// Recursive character splitter — good default for mixed content
function recursiveChunk(text: string, maxTokens = 512, overlap = 50): string[] {
  const separators = ["\n\n", "\n", ". ", " "]
  const chunks: string[] = []

  function split(text: string, seps: string[]): string[] {
    if (text.length <= maxTokens) return [text]
    const sep = seps[0] ?? " "
    const parts = text.split(sep)
    let current = ""
    for (const part of parts) {
      if ((current + sep + part).length > maxTokens && current) {
        chunks.push(current.trim())
        current = current.slice(-overlap * 4) // preserve overlap context
      }
      current += sep + part
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
  }

  return split(text, separators)
}
```

### Embedding Pipeline

```typescript
import OpenAI from "openai"

const openai = new OpenAI()

async function embedText(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}
```

### Hybrid Retrieval (Dense + BM25)

```typescript
async function hybridRetrieve(query: string, topK = 10) {
  const [denseResults, sparseResults] = await Promise.all([
    vectorStore.similaritySearch(query, topK),
    bm25Index.search(query, topK),
  ])

  // Reciprocal Rank Fusion
  const scores = new Map<string, number>()
  const k = 60

  for (const [rank, doc] of denseResults.entries()) {
    const id = doc.id
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank))
  }
  for (const [rank, doc] of sparseResults.entries()) {
    const id = doc.id
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank))
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id]) => id)
}
```

### Reranking

```typescript
import { CohereClient } from "cohere-ai"

const cohere = new CohereClient({ apiKey: process.env.COHERE_API_KEY })

async function rerank(query: string, documents: string[], topN = 5) {
  const results = await cohere.rerank({
    query,
    documents,
    topN,
    model: "rerank-english-v3.0",
  })
  return results.results
}
```

## Configuration

### Chunking Config

```typescript
const chunkConfig = {
  // Code files — split on function/class boundaries
  code: { strategy: "ast-aware", maxTokens: 1024, overlap: 0 },
  // Markdown — split on headers, preserve structure
  markdown: { strategy: "recursive", maxTokens: 512, overlap: 100, separators: ["\n## ", "\n### ", "\n"] },
  // Plain text — fixed size with overlap
  text: { strategy: "fixed", maxTokens: 256, overlap: 50 },
}
```

### Embedding Model Selection

| Model | Dimensions | Speed | Quality | Cost |
|-------|-----------|-------|---------|------|
| `text-embedding-3-small` | 1536 | Fast | Good | Low |
| `text-embedding-3-large` | 3072 | Medium | Better | Medium |
| `embed-english-v3.0` | 1024 | Fast | Good | Low |
| `bge-large-en-v1.5` | 1024 | Medium | Good | Free (self-host) |

## Best Practices

- Start with recursive chunking at 512 tokens with 50-100 token overlap — tune from there
- Use hybrid retrieval (dense + BM25) for best recall across query types
- Always add a reranking step for top-10 → top-5 to boost precision
- Store metadata (source, page, section) alongside embeddings for filtering
- Evaluate with a held-out test set using recall@5, MRR, and answer faithfulness
- Use `text-embedding-3-small` for most use cases; upgrade to `large` only if quality gaps are measured
- Chunk code at AST boundaries (functions, classes) rather than fixed token counts
- For multi-document Q&A, include document titles in chunk text for better retrieval
- Cache embeddings to avoid re-embedding unchanged documents
- Monitor retrieval quality with end-to-end benchmarks before tuning generation prompts
