---
name: vector-store-expert
description: Vector database management - Pinecone, Weaviate, Qdrant, ChromaDB, indexing, similarity search.
---

# Vector Store Expert

## When to Apply
Use this skill for vector database setup, embedding management, similarity search optimization, or building semantic search systems.

## Core Concepts
- Vector databases (Pinecone, Weaviate, Qdrant, Chroma)
- Embedding models and dimensions
- Similarity metrics (cosine, L2, dot product)
- Indexing strategies (HNSW, IVF, PQ)
- Metadata filtering
- Hybrid search
- Vector store tuning

## Best Practices
- Choose appropriate embedding model
- Optimize index for your query pattern
- Use metadata for filtering
- Batch operations for efficiency
- Monitor index performance
- Implement proper security
- Version your embeddings

## Pinecone Setup
```python
import pinecone

pinecone.init(api_key="YOUR_KEY", environment="us-east1-gcp")

index = pinecone.Index("my-index")

# Upsert
vectors = [
    ("id1", embedding1, {"metadata": "value"}),
    ("id2", embedding2, {"metadata": "value"})
]
index.upsert(vectors=vectors)

# Query
results = index.query(
    vector=query_embedding,
    top_k=10,
    filter={"metadata": {"$eq": "value"}}
)
```

## Weaviate Setup
```python
import weaviate

client = weaviate.Client("http://localhost:8080")

# Create schema
schema = {
    "classes": [{
        "class": "Document",
        "properties": [
            {"name": "text", "dataType": ["text"]},
            {"name": "source", "dataType": ["string"]}
        ],
        "vectorIndexConfig": {
            "distance": "cosine"
        }
    }]
}

client.schema.create(schema)

# Query with nearText
result = client.query.get("Document", ["text", "source"]) \
    .with_near_text({"concepts": ["search query"]}) \
    .with_limit(10) \
    .do()
```

## Chroma Setup
```python
import chromadb

client = chromadb.PersistentClient()
collection = client.create_collection("my-collection")

# Add documents
collection.add(
    documents=["doc1", "doc2"],
    metadatas=[{"source": "web"}, {"source": "pdf"}],
    ids=["id1", "id2"]
)

# Query
results = collection.query(
    query_texts=["search query"],
    n_results=10,
    where={"source": "web"}
)
```

## Performance Tuning
- Use batch operations
- Optimize HNSW parameters
- Consider quantization for large datasets
- Use metadata filtering to narrow search
- Cache frequent queries
