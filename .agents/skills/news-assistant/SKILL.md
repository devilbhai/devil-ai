---
name: news-assistant
description: News aggregation. Topic filtering, summary generation, source verification.
---

# News Assistant

## When to Apply

- Aggregating news from multiple sources
- Filtering news by topics and keywords
- Generating concise news summaries
- Verifying news source credibility
- Tracking news trends and developments

## Core Concepts

- **News Aggregation**: Collecting articles from various sources
- **Topic Filtering**: Categorizing and filtering by relevance
- **Summarization**: Creating concise article summaries
- **Source Verification**: Assessing credibility and bias
- **Trend Analysis**: Identifying emerging stories and topics

## Implementation

```typescript
interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  author: string
  publishedAt: Date
  url: string
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  credibilityScore: number
}

interface NewsFilter {
  topics: string[]
  keywords: string[]
  sources: string[]
  dateRange: { start: Date; end: Date }
  minCredibility: number
}

interface NewsSummary {
  articleId: string
  summary: string
  keyPoints: string[]
  entities: string[]
  sentiment: string
}

function filterArticles(articles: NewsArticle[], filter: NewsFilter): NewsArticle[] {
  return articles.filter((article) => {
    // Check topic match
    if (filter.topics.length > 0) {
      const hasTopic = filter.topics.some((topic) =>
        article.topics.includes(topic.toLowerCase())
      )
      if (!hasTopic) return false
    }
    
    // Check keyword match
    if (filter.keywords.length > 0) {
      const hasKeyword = filter.keywords.some((keyword) =>
        article.title.toLowerCase().includes(keyword.toLowerCase()) ||
        article.summary.toLowerCase().includes(keyword.toLowerCase())
      )
      if (!hasKeyword) return false
    }
    
    // Check source match
    if (filter.sources.length > 0) {
      if (!filter.sources.includes(article.source)) return false
    }
    
    // Check date range
    if (filter.dateRange) {
      if (article.publishedAt < filter.dateRange.start ||
          article.publishedAt > filter.dateRange.end) {
        return false
      }
    }
    
    // Check credibility
    if (article.credibilityScore < filter.minCredibility) {
      return false
    }
    
    return true
  })
}

function generateSummary(article: NewsArticle): NewsSummary {
  // Simple extractive summarization
  const sentences = article.content.split('. ')
  const keyPoints = sentences.slice(0, 3).map((s) => s.trim())
  
  return {
    articleId: article.id,
    summary: article.summary,
    keyPoints,
    entities: extractEntities(article.content),
    sentiment: article.sentiment,
  }
}

function extractEntities(text: string): string[] {
  // Simple entity extraction (in real implementation, use NLP library)
  const entities: string[] = []
  const words = text.split(' ')
  
  for (const word of words) {
    if (word[0] === word[0].toUpperCase() && word.length > 3) {
      entities.push(word)
    }
  }
  
  return [...new Set(entities)].slice(0, 5)
}
```

## Best Practices

1. Verify news from multiple sources
2. Check publication date for relevance
3. Consider source bias and credibility
4. Use fact-checking websites
5. Be cautious of sensational headlines
6. Distinguish between news and opinion pieces
7. Track breaking news carefully
8. Archive important articles for reference
9. Share verified information only
10. Stay updated on current events regularly