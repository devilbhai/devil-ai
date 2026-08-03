---
name: auto-complete
description: Auto-completion systems. Context-aware completion, snippet expansion, template filling.
---

# Auto-Complete

## When to Apply
Use this skill when implementing code completion, text expansion, snippet systems, or template-based code generation.

## Core Concepts
- **Trigger patterns**: Keywords, prefixes, or regex patterns that activate completion
- **Context awareness**: Language-aware completions (imports, types, functions)
- **Snippet syntax**: Tab stops, placeholders, mirrors
- **Snippet libraries**: Organized collections of reusable templates
- **Priority ranking**: Order completions by relevance and usage frequency

## Implementation
```typescript
interface Snippet {
  prefix: string
  body: string[]
  description: string
  scope: string[]
}

const snippets: Record<string, Snippet> = {
  "react-component": {
    prefix: "rfc",
    body: [
      "import React from 'react'",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${2:// props}",
      "}",
      "",
      "export function ${1:ComponentName}({ ${2} }: ${1:ComponentName}Props) {",
      "  return <div>${0}</div>",
      "}",
    ],
    description: "React functional component",
    scope: ["typescriptreact"],
  },
}

function expandSnippet(snippet: Snippet, variables: Record<string, string>) {
  return snippet.body.map((line) =>
    line.replace(/\$\{(\d+):([^}]*)\}/g, (_, index, defaultVal) =>
      variables[index] ?? defaultVal
    )
  )
}
```

## Best Practices
- Trigger completions on configurable prefixes (not every keystroke)
- Show preview of expanded snippet before inserting
- Support nested snippets and variable interpolation
- Allow user-defined snippets stored in project config
- Cache compiled snippets for fast repeated expansion
- Provide undo support for snippet expansion
