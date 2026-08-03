---
name: conversation-summarizer
description: Conversation summarization. Key point extraction, action item detection, summary generation.
---

# Conversation Summarizer

## When to Apply
Use to create summaries of long conversations, extract action items from discussions, or generate handoff notes between sessions. Apply when context is getting long or when work needs to continue later.

## Core Concepts
- **Key point extraction**: Identify the most important information
- **Action item detection**: Find tasks, decisions, and commitments
- **Decision logging**: Record what was decided and why
- **Context preservation**: Maintain continuity across sessions
- **Structured output**: Format summaries for easy scanning
- **Selective detail**: Include enough detail for continuity

## Implementation
```
1. Scan conversation for key themes and decisions
2. Extract action items with ownership and deadlines
3. Identify open questions and blockers
4. Capture important context that affects future work
5. Format into structured summary
6. Verify completeness against original conversation
```

## Best Practices
- Start with a one-paragraph executive summary
- Use bullet points for action items and decisions
- Include file paths and line numbers for code references
- Note any unresolved issues or questions
- Keep summaries actionable, not just descriptive
