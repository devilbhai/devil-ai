---
name: vector-database
description: Vector database expert (Pinecone, Weaviate, Qdrant, ChromaDB, Milvus). Covers indexing, similarity search, hybrid search, metadata filtering, performance optimization.
---

# Vector Database Expert

## When to Apply

- Selecting a vector database (Pinecone vs Weaviate vs Qdrant vs ChromaDB vs Milvus) based on scale and deployment
- Creating collections/indexes with appropriate distance metrics and index types
- Performing similarity search with metadata filtering and payload-based conditions
- Implementing hybrid search combining dense vectors with keyword/attribute matching
- Optimizing indexing performance, memory usage, and query latency at scale
- Migrating between vector databases or upgrading index configurations
- Debugging search quality issues (low recall, incorrect ranking)

## Core Patterns

### Pinecone

```typescript
import { Pinecone } from "@pinecone-database/pinecone"

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const index = pinecone.index("my-index")

// Upsert
await index.upsert([
  { id: "doc-1", values: embedding, metadata: { source: "file.txt", page: 1 } },
])

// Query with metadata filter
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true,
  filter: { source: { $eq: "file.txt" }, page: { $gte: 1 } },
})
```

### Qdrant

```typescript
import { QdrantClient } from "@qdrant/js-client-rest"

const client = new QdrantClient({ host: "localhost", port: 6333 })

// Create collection
await client.createCollection("documents", {
  vectors: { size: 1536, distance: "Cosine" },
})

// Search with payload filter
const results = await client.search("documents", {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [
      { key: "source", match: { value: "file.txt" } },
      { key: "page", range: { gte: 1 } },
    ],
  },
  with_payload: true,
})
```

### ChromaDB

```typescript
import { ChromaClient } from "chromadb"

const chroma = new ChromaClient({ path: "http://localhost:8000" })
const collection = await chroma.getOrCreateCollection("documents")

// Add documents
await collection.add({
  ids: ["doc-1"],
  embeddings: [embedding],
  metadatas: [{ source: "file.txt", page: 1 }],
  documents: ["chunk text"],
})

// Query with where filter
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 10,
  where: { $and: [{ source: { $eq: "file.txt" } }, { page: { $gte: 1 } }] },
})
```

### Weaviate

```typescript
import weaviate from "weaviate-client"

const client = weaviate.client({ scheme: "http", host: "localhost:8080 })

// Near-vector search with filter
const result = await client.graphql
  .get()
  .withClassName("Document")
  .withNearVector({ vector: queryEmbedding })
  .withWhere({
    operator: "And",
    operands: [
      { path: ["source"], operator: "Equal", valueText: "file.txt" },
      { path: ["page"], operator: "GreaterThanEqual", valueInt: 1 },
    ],
  })
  .withLimit(10)
  .do()
```

### Milvus

```typescript
import { MilvusClient } from "@zilliz/milvus2-sdk-node"

const client = new MilvusClient({ address: "localhost:19530" })

// Search
const results = await client.search({
  collection_name: "documents",
  vectors: [queryEmbedding],
  limit: 10,
  output_fields: ["source", "page", "text"],
  filter: 'source == "file.txt" && page >= 1',
})
```

## Configuration

### Index Type Selection

| Database | Flat | HNSW | IVF | Disk-based |
|----------|------|------|-----|------------|
| Pinecone | Auto | Auto | Auto | Serverless |
| Qdrant | Yes | Yes (default) | - | Yes (mmap) |
| ChromaDB | Yes (default) | Yes | - | - |
| Weaviate | Flat | HNSW (default) | - | - |
| Milvus | Flat | HNSW | IVF_FLAT | DiskANN |

### Distance Metrics

| Metric | Use Case | Range |
|--------|----------|-------|
| Cosine | General semantic similarity | [-1, 1] |
| Euclidean | Geometric proximity | [0, ∞) |
| Dot Product | Optimized cosine (normalized vectors) | [-∞, ∞) |

## Best Practices

- Use Cosine distance for most semantic search use cases; Euclidean for clustering tasks
- Choose HNSW for low-latency search at scale; IVF for memory-constrained environments
- Add metadata filters at query time, not post-filter after retrieval
- For >10M vectors, use managed services (Pinecone) or disk-backed indices (Qdrant mmap, Milvus DiskANN)
- Monitor QPS, latency p99, and recall@k to evaluate index performance
- Batch upserts in chunks of 100-500 for optimal write throughput
- Use `include_metadata: false` when payloads aren't needed to reduce latency
- For hybrid search, combine vector search with keyword index (BM25) via reciprocal rank fusion
- Pin collection dimensions at creation time — most databases don't support dynamic resizing
- Test with realistic query distributions, not synthetic embeddings, to catch quality issues early
