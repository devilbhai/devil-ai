---
name: tool-router
description: Intelligent tool selection. Tool capability matching, parameter optimization, fallback strategies.
---

# Tool Router

## When to Apply
Use when selecting the right tool for a task, when multiple tools could accomplish the same goal, or when optimizing tool usage for efficiency. Apply to choose between approaches and handle tool failures.

## Core Concepts
- **Capability matching**: Map task requirements to tool capabilities
- **Parameter optimization**: Choose optimal parameters for each tool
- **Fallback strategies**: Alternative tools when primary fails
- **Tool composition**: Combine multiple tools for complex tasks
- **Performance profiling**: Track tool execution times
- **Error classification**: Distinguish recoverable from fatal errors

## Implementation
```
1. Analyze task requirements
2. Search available tools for capability matches
3. Rank tools by suitability and efficiency
4. Select primary tool with optimal parameters
5. Define fallback tools and strategies
6. Monitor execution and switch if needed
7. Log tool usage for future optimization
```

## Best Practices
- Always have a fallback strategy
- Prefer specialized tools over general-purpose when available
- Cache tool results when appropriate
- Document tool limitations and edge cases
- Monitor tool performance and adjust selection over time
