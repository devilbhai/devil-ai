---
name: code-explainer
description: Explain code functionality, architecture, and logic to developers of all skill levels.
---

# Code Explainer

## When to Apply
Use this skill when explaining code, walking through logic, documenting functions, or helping developers understand unfamiliar codebases.

## Core Concepts
- Line-by-line explanation
- Architecture overview
- Data flow tracing
- Pattern identification
- Analogies for complex concepts

## Implementation

### Explain Function
```typescript
interface Explanation {
  summary: string
  lineExplanations: { line: number; explanation: string }[]
  inputs: { name: string; type: string; purpose: string }[]
  outputs: { type: string; description: string }[]
  sideEffects: string[]
  complexity: string
}

function explainCode(code: string, context?: string): Explanation {
  // Parse code structure
  // Generate explanations
  // Return structured explanation
}
```

### Explanation Levels
- **Beginner**: Simple analogies, what it does
- **Intermediate**: How it works, patterns used
- **Advanced**: Trade-offs, edge cases, optimization

### Example Output
```markdown
## Function: `processUserInput`

**Purpose**: Validates and sanitizes user input before database insertion

**Line-by-line**:
- L1-3: Extract and trim input fields
- L4-7: Validate email format using regex
- L8-10: Sanitize HTML to prevent XSS
- L11-13: Insert into database with parameterized query

**Side Effects**: Modifies database state
**Time Complexity**: O(1) for validation, O(n) for sanitization
```

## Best Practices
- Start with high-level summary before details
- Use analogies for complex algorithms
- Explain WHY, not just WHAT
- Point out potential issues or improvements
- Adjust explanation depth to audience
