---
name: biome-formatting
description: Biome configuration, formatting rules, linting rules, import sorting, and code style enforcement for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Biome Formatting Patterns

Biome configuration and code style patterns for the Devil AI codebase.

## When to Apply

- Configuring Biome
- Formatting code
- Linting code
- Sorting imports
- Enforcing code style

---

## 1. Configuration

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "warn",
        "noUnusedVariables": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  }
}
```

---

## 2. Formatting Rules

### Indentation

```typescript
// ✅ 2 spaces indentation
function example() {
  if (true) {
    return {
      key: "value",
    }
  }
}
```

### Line Width

```typescript
// ✅ Max 100 characters per line
const longString =
  "This is a long string that should be broken into multiple lines to stay within the 100 character limit"
```

### Trailing Commas

```typescript
// ✅ Trailing commas everywhere
const array = [1, 2, 3,]

const object = {
  key1: "value1",
  key2: "value2",
}

function example(
  param1: string,
  param2: number,
) {
  // ...
}
```

### Quotes

```typescript
// ✅ Double quotes
const name = "Devil AI"
const message = `Hello, ${name}`

// ✅ JSX quotes
<div className="container" />
```

---

## 3. Linting Rules

### Unused Imports

```typescript
// ❌ Unused import
import { useState, useEffect } from "react"
// useEffect is not used

// ✅ Remove unused imports
import { useState } from "react"
```

### Unused Variables

```typescript
// ❌ Unused variable
const unused = "not used"

// ✅ Prefix with underscore or remove
const _unused = "not used"
```

### Non-null Assertion

```typescript
// ❌ Non-null assertion
const element = document.getElementById("app")!

// ✅ Use optional chaining or type guard
const element = document.getElementById("app")
if (!element) return
```

### Explicit Any

```typescript
// ❌ Explicit any
function example(value: any) {
  return value
}

// ✅ Use proper types
function example(value: string) {
  return value
}

// ✅ Or use unknown
function example(value: unknown) {
  if (typeof value === "string") {
    return value
  }
}
```

---

## 4. Import Sorting

### Default Order

```typescript
// ✅ Biome sorts imports automatically
import React from "react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { formatDate } from "@/lib/utils"

import { useAuth } from "@/hooks/use-auth"
```

### Custom Sort Order

```json
{
  "organizeImports": {
    "enabled": true
  }
}
```

---

## 5. VS Code Integration

### Extension

```json
// ✅ .vscode/extensions.json
{
  "recommendations": ["biomejs.biome"]
}
```

### Settings

```json
// ✅ .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  }
}
```

### Keybindings

```json
// ✅ .vscode/keybindings.json
[
  {
    "key": "shift+alt+f",
    "command": "editor.action.formatDocument",
    "when": "editorTextFocus"
  }
]
```

---

## 6. CI Integration

### GitHub Actions

```yaml
# ✅ .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          bun-version: latest
      
      - run: bun install --frozen-lockfile
      
      - name: Lint
        run: bunx biome check .
      
      - name: Format check
        run: bunx biome format .
```

### Pre-commit Hook

```bash
# ✅ .husky/pre-commit
bunx biome check --staged --no-errors-on-unmatched
```

---

## 7. Migration from ESLint

### Migration Steps

```bash
# ✅ 1. Install Biome
bun add -D @biomejs/biome

# ✅ 2. Initialize Biome
bunx biome init

# ✅ 3. Migrate from ESLint
bunx biome migrate eslint

# ✅ 4. Remove ESLint
bun remove eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-config-prettier

# ✅ 5. Update scripts in package.json
{
  "scripts": {
    "lint": "bunx biome check .",
    "lint:fix": "bunx biome check --write .",
    "format": "bunx biome format --write ."
  }
}
```

---

## 8. Best Practices

1. **Enable format on save** — Consistent formatting
2. **Enable organize imports on save** — Clean imports
3. **Use recommended rules** — Start with defaults
4. **Customize rules** — Adjust for your needs
5. **Run in CI** — Catch issues early
6. **Use pre-commit hooks** — Prevent bad commits
7. **Migrate from ESLint** — Biome is faster
8. **Keep config updated** — Use latest features
9. **Document conventions** — Help team follow rules
10. **Review changes** — Don't auto-merge without review
