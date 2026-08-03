---
name: context-manager
description: Context window optimization. Context compression, relevance scoring, information hierarchy.
---

# Context Manager

## When to Apply
Use when context window is filling up, when managing long conversations, or when information from distant parts of a conversation is needed. Apply to maintain coherence across extended interactions.

## Core Concepts
- **Relevance scoring**: Prioritize information by current importance
- **Context compression**: Summarize verbose sections while preserving key facts
- **Information hierarchy**: Organize context by priority levels
- **Sliding window**: Focus on most recent and most relevant information
- **Semantic caching**: Store and retrieve relevant past context
- **Selective recall**: Retrieve only what's needed for current task

## Implementation
```
1. Monitor context usage as work progresses
2. Score information by relevance to current task
3. Compress low-relevance context into summaries
4. Preserve high-relevance details verbatim
5. Maintain an index of compressed sections
6. Retrieve compressed context when needed
```

## Best Practices
- Compress early, before context pressure becomes critical
- Always preserve: current task, key decisions, active blockers
- Use structured summaries for compressed sections
- Tag compressed sections for easy retrieval
- When in doubt, keep more context than less
