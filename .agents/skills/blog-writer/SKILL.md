---
name: blog-writer
description: Blog writing. Long-form content, SEO optimization, engagement strategies.
---

# Blog Writer

## When to Apply
Use this skill when writing long-form blog posts, optimizing for search engines, or developing content strategies for blogs.

## Core Concepts
- SEO-first writing: keywords, headers, meta descriptions
- Pillar content: comprehensive guides on core topics
- Internal linking strategy: connect related content
- Readability: short paragraphs, subheadings, lists
- Content upgrades: lead magnets within posts

## Implementation

```typescript
interface BlogPost {
  topic: string
  targetKeyword: string
  wordCount: number
  type: "how-to" | "listicle" | "guide" | "case-study" | "opinion"
  audience: string
}

function generateBlogPost(post: BlogPost): BlogStructure {
  const outline = createSEOOutline(post.topic, post.targetKeyword)
  const introduction = writeHookIntro(post.topic, post.audience)
  const sections = writeSections(outline, post.wordCount)
  const conclusion = writeConclusion(post.topic)
  const meta = generateMeta(post.targetKeyword)

  return { introduction, sections, conclusion, meta }
}

function optimizeForSEO(post: BlogStructure, keyword: string): BlogStructure {
  return {
    ...post,
    meta: {
      ...post.meta,
      title: optimizeTitle(keyword),
      description: optimizeDescription(keyword),
    },
    sections: post.sections.map(s => optimizeSection(s, keyword)),
  }
}
```

## Best Practices
- Target one primary keyword per post
- Include keyword in H1, first paragraph, and subheadings
- Write 1500+ words for competitive keywords
- Use internal links to related posts
- Add images with descriptive alt text
- Update and republish old posts periodically
