---
name: document-search
description: Document search systems. Full-text search, faceted search, relevance tuning.
---

# Document Search

## When to Apply
Use this skill when building document search systems, including full-text search engines, faceted search interfaces, document indexing, and search relevance optimization.

## Core Concepts
- **Full-Text Search**: Tokenization, inverted indexes, term frequency, BM25 scoring, phrase queries
- **Faceted Search**: Category filters, date ranges, tag filtering, dynamic facets, drill-down navigation
- **Relevance Tuning**: Field boosting, boost functions, custom scoring, A/B testing search quality
- **Indexing Pipelines**: Document parsing, text extraction, metadata extraction, index schema design
- **Search UI**: Autocomplete, typo tolerance, result highlighting, search suggestions
- **Analytics**: Query logging, click-through rates, search abandonment, zero-result queries
- **Multi-Language**: Stemming, lemmatization, stop words, Unicode normalization

## Implementation
```python
from typing import List, Dict, Optional
from dataclasses import dataclass
import json

@dataclass
class Document:
    id: str
    title: str
    content: str
    category: str
    tags: List[str]
    created_at: str
    metadata: Dict

@dataclass
class SearchFilters:
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    custom: Optional[Dict] = None

class DocumentSearchEngine:
    def __init__(self, es_client):
        self.es = es_client
        self.index_name = "documents"

    def create_index(self):
        self.es.indices.create(
            index=self.index_name,
            body={
                "settings": {
                    "analysis": {
                        "analyzer": {
                            "document_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "stop",
                                    "snowball"
                                ]
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "title": {
                            "type": "text",
                            "analyzer": "document_analyzer",
                            "boost": 2.0
                        },
                        "content": {
                            "type": "text",
                            "analyzer": "document_analyzer"
                        },
                        "category": { "type": "keyword" },
                        "tags": { "type": "keyword" },
                        "created_at": { "type": "date" },
                        "metadata": { "type": "object", "enabled": False }
                    }
                }
            }
        )

    def index_document(self, doc: Document):
        self.es.index(
            index=self.index_name,
            id=doc.id,
            body={
                "title": doc.title,
                "content": doc.content,
                "category": doc.category,
                "tags": doc.tags,
                "created_at": doc.created_at,
                "metadata": doc.metadata
            }
        )

    def search(
        self,
        query: str,
        filters: Optional[SearchFilters] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        must = []
        filter_clauses = []

        # Full-text search with boosting
        if query:
            must.append({
                "multi_match": {
                    "query": query,
                    "fields": ["title^2", "content", "tags^1.5"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })

        # Apply filters
        if filters:
            if filters.categories:
                filter_clauses.append({"terms": {"category": filters.categories}})
            if filters.tags:
                filter_clauses.append({"terms": {"tags": filters.tags}})
            if filters.date_from or filters.date_to:
                range_clause = {}
                if filters.date_from:
                    range_clause["gte"] = filters.date_from
                if filters.date_to:
                    range_clause["lte"] = filters.date_to
                filter_clauses.append({"range": {"created_at": range_clause}})

        body = {
            "query": {
                "bool": {
                    "must": must or [{"match_all": {}}],
                    "filter": filter_clauses
                }
            },
            "highlight": {
                "fields": {
                    "title": {},
                    "content": {
                        "fragment_size": 150,
                        "number_of_fragments": 3
                    }
                }
            },
            "aggs": {
                "categories": {
                    "terms": { "field": "category", "size": 20 }
                },
                "tags": {
                    "terms": { "field": "tags", "size": 50 }
                },
                "date_histogram": {
                    "date_histogram": {
                        "field": "created_at",
                        "calendar_interval": "month"
                    }
                }
            },
            "from": (page - 1) * page_size,
            "size": page_size
        }

        response = self.es.search(index=self.index_name, body=body)

        return {
            "results": [
                {
                    "id": hit["_id"],
                    "score": hit["_score"],
                    "title": hit["_source"]["title"],
                    "content": hit["_source"]["content"],
                    "category": hit["_source"]["category"],
                    "tags": hit["_source"]["tags"],
                    "highlights": hit.get("highlight", {})
                }
                for hit in response["hits"]["hits"]
            ],
            "total": response["hits"]["total"]["value"],
            "facets": {
                "categories": [
                    {"key": b["key"], "count": b["doc_count"]}
                    for b in response["aggregations"]["categories"]["buckets"]
                ],
                "tags": [
                    {"key": b["key"], "count": b["doc_count"]}
                    for b in response["aggregations"]["tags"]["buckets"]
                ]
            },
            "page": page,
            "page_size": page_size
        }

    def autocomplete(self, prefix: str, size: int = 5) -> List[str]:
        response = self.es.search(
            index=self.index_name,
            body={
                "suggest": {
                    "title-suggest": {
                        "prefix": prefix,
                        "completion": {
                            "field": "title.suggest",
                            "size": size,
                            "fuzzy": { "fuzziness": "AUTO" }
                        }
                    }
                }
            }
        )
        return [
            opt["text"]
            for opt in response["suggest"]["title-suggest"][0]["options"]
        ]
```

## Best Practices
- Use BM25 as the default scoring algorithm — it's robust and well-understood
- Implement faceted search to help users narrow results without reformulating queries
- Log all search queries and track zero-result queries for improvement opportunities
- Use field boosting (title ^ 2) to prioritize matches in important fields
- Implement typo tolerance and fuzzy matching for user-friendly search
- Cache frequent search results with short TTL for performance
- A/B test relevance changes with real user click-through data
- Set up search analytics dashboards to monitor query patterns and quality
