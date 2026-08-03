---
name: cursor-controller
description: Cursor AI IDE automation. AI feature control, workspace management, configuration.
---

# Cursor Controller

## When to Apply
Use this skill when automating Cursor IDE operations: controlling AI features, managing workspace settings, or configuring Cursor-specific functionality.

## Core Concepts
- Cursor is a fork of VS Code with integrated AI features
- AI settings are configured via `.cursor/settings.json` and `settings.json`
- Cursor rules live in `.cursorrules` or `.cursor/rules`
- Chat and composer are primary AI interfaces
- `.cursorignore` controls which files AI considers for context

## Implementation

### Cursor Rules Configuration
```markdown
<!-- .cursorrules -->
# Project Rules
- Use TypeScript strict mode
- Prefer named exports
- Use node: protocol for builtins
- Follow existing code patterns
```

### Settings Configuration
```json
// .cursor/settings.json
{
  "cursor.chat.model": "claude-3-5-sonnet",
  "cursor.composer.autoCompile": true,
  "editor.inlineSuggest.enabled": true
}
```

### Ignore Patterns
```
# .cursorignore
node_modules
dist
build
*.min.js
.env
.env.local
```

### Workspace-specific Rules
```markdown
<!-- .cursor/rules/project.mdc -->
---
description: Project-specific coding conventions
globs: ["src/**/*.ts", "src/**/*.tsx"]
alwaysApply: false
---
Always use React.FC for component type annotations.
Prefer hooks over class components.
```

## Best Practices
- Keep `.cursorrules` concise and actionable for better AI adherence
- Use `.cursor/rules` for granular, glob-based rule targeting
- Include examples in rules to improve AI code generation quality
- Review AI suggestions before committing, especially for security-sensitive code
