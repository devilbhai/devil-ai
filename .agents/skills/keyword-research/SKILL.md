---
name: keyword-research
description: Keyword research. Search volume analysis, competition assessment, keyword grouping.
---

# Keyword Research

## When to Apply
Use this skill when researching keywords for SEO, PPC campaigns, content planning, or competitive analysis.

## Core Concepts
- Search volume: monthly search frequency
- Keyword difficulty: competition level for ranking
- Search intent: informational, navigational, transactional, commercial
- Long-tail keywords: specific, lower competition, higher conversion
- Keyword clustering: group related terms for topical authority

## Implementation

```typescript
interface KeywordResearch {
  seedKeyword: string
  industry: string
  goal: "traffic" | "conversions" | "brand-awareness"
}

interface KeywordData {
  keyword: string
  volume: number
  difficulty: number
  intent: "informational" | "navigational" | "transactional" | "commercial"
  cpc?: number
}

function researchKeywords(seed: string): KeywordData[] {
  const related = getRelatedKeywords(seed)
  const questions = getQuestionKeywords(seed)
  const longTail = getLongTailVariations(seed)

  return [...related, ...questions, ...longTail]
    .map(kw => enrichWithMetrics(kw))
    .filter(kw => kw.volume > 0)
    .sort((a, b) => b.volume - a.volume)
}

function clusterKeywords(keywords: KeywordData[]): Map<string, KeywordData[]> {
  const clusters = new Map<string, KeywordData[]>()
  for (const kw of keywords) {
    const cluster = findBestCluster(kw, clusters)
    cluster.push(kw)
  }
  return clusters
}
```

## Best Practices
- Start with seed keywords from your business
- Include question-based keywords (who, what, how, why)
- Balance volume and difficulty
- Group keywords by search intent
- Update research quarterly
- Track competitor keyword strategies
