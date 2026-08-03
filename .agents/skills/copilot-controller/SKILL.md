---
name: copilot-controller
description: GitHub Copilot integration. Suggestion management, context optimization, feature control.
---

# Copilot Controller

## When to Apply
Use this skill when integrating or optimizing GitHub Copilot: managing suggestions, optimizing context for better completions, or configuring Copilot features.

## Core Concepts
- Copilot uses surrounding code and open files as context
- `.copilotignore` controls which files Copilot reads
- Copilot Chat provides conversational AI assistance
- Inline suggestions are triggered by typing patterns
- Copilot Labs provides advanced features (explain, fix, translate)

## Implementation

### Context Optimization
```markdown
# Write descriptive comments before code
// Calculate the total price with tax for the given items
function calculateTotal(items: CartItem[]): number {

# Use clear variable and function names
// Good: fetchUserPermissions(userId: string)
// Bad: getStuff(id: string)
```

### Copilot Ignore
```
# .copilotignore
*.test.ts
*.spec.ts
__tests__/
mocks/
fixtures/
```

### Copilot Chat Commands
```
# Inline chat shortcuts
/explain    - Explain selected code
/fix        - Fix issues in selected code
/tests      - Generate tests for selected code
/doc        - Generate documentation
/fixThis    - Fix this specific issue
```

### Workspace Configuration
```json
// settings.json
{
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true,
    "scminput": false
  }
}
```

## Best Practices
- Write clear, descriptive comments to guide Copilot's suggestions
- Use function signatures with types for better TypeScript suggestions
- Review all Copilot suggestions for security vulnerabilities
- Combine with `.github/copilot-instructions.md` for repository-wide guidance
- Use Copilot Chat for complex reasoning, inline for quick completions
