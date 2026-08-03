---
name: monorepo-turborepo
description: Turborepo pipeline patterns, workspace management, caching strategies, and dependency graphs for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Monorepo Turborepo Patterns

Turborepo and monorepo patterns for the Devil AI codebase.

## When to Apply

- Configuring build pipelines
- Managing workspace dependencies
- Optimizing build caching
- Setting up development workflows
- Understanding dependency graphs

---

## 1. Turborepo Configuration

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "dist-electron/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "check-types": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  },
  "globalDependencies": ["bun.lockb"],
  "globalEnv": ["NODE_ENV"]
}
```

### Task Dependencies

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 2. Workspace Structure

### Package Layout

```
devil-ai/
├── apps/
│   ├── desktop/          # Electron app
│   └── server/           # Hono backend
├── packages/
│   ├── ui/               # Shared UI components
│   ├── configconv/       # Config converter
│   └── configconv-cli/   # CLI wrapper
├── turbo.json
├── package.json
└── bun.lockb
```

### Root package.json

```json
{
  "name": "devil-ai",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

### Package package.json

```json
{
  "name": "@devil-ai/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "biome check .",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 3. Caching

### Cache Configuration

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**", "dist-electron/**"],
      "inputs": ["src/**", "tsconfig.json"]
    }
  }
}
```

### Cache Commands

```bash
# ✅ Run with cache
turbo run build

# ✅ Force rebuild (ignore cache)
turbo run build --force

# ✅ Verbose logging
turbo run build --verbose

# ✅ Show cache stats
turbo run build --dry

# ✅ Clear cache
rm -rf node_modules/.cache/turbo
```

### Cache Invalidation

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "tsconfig.json", "package.json"]
    }
  }
}
```

---

## 4. Development Workflow

### Concurrent Development

```bash
# ✅ Run all dev tasks
turbo run dev

# ✅ Run specific package
turbo run dev --filter=@devil-ai/ui

# ✅ Run with dependencies
turbo run dev --filter=@devil-ai/desktop...

# ✅ Run without dependencies
turbo run dev --filter=@devil-ai/desktop --no-dependencies
```

### Filter Patterns

```bash
# ✅ Filter by package name
turbo run build --filter=@devil-ai/ui

# ✅ Filter by directory
turbo run build --filter=apps/desktop

# ✅ Filter with dependencies
turbo run build --filter=@devil-ai/desktop...

# ✅ Filter with glob
turbo run build --filter=@devil-ai/*
```

---

## 5. Dependency Management

### Internal Dependencies

```json
// ✅ apps/desktop/package.json
{
  "name": "@devil-ai/desktop",
  "dependencies": {
    "@devil-ai/ui": "workspace:*",
    "@devil-ai/configconv": "workspace:*"
  }
}
```

### External Dependencies

```json
// ✅ Root package.json
{
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.4.0",
    "biome": "^1.0.0"
  },
  "dependencies": {
    "react": "^19.0.0"
  }
}
```

### Shared Dependencies

```bash
# ✅ Add dependency to all packages
turbo run add --filter=@devil-ai/* -- some-package

# ✅ Add dev dependency to root
bun add -D some-package
```

---

## 6. Build Pipeline

### Build Order

```
1. packages/ui (no dependencies)
2. packages/configconv (depends on ui)
3. packages/configconv-cli (depends on configconv)
4. apps/desktop (depends on ui, configconv)
5. apps/server (independent)
```

### Parallel Execution

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

## 7. Scripts

### Common Scripts

```bash
# ✅ Development
turbo run dev                    # Run all dev tasks
turbo run dev --filter=desktop   # Run desktop dev only

# ✅ Build
turbo run build                  # Build all packages
turbo run build --force          # Force rebuild

# ✅ Lint
turbo run lint                   # Lint all packages
turbo run lint --filter=@devil-ai/ui

# ✅ Type check
turbo run check-types            # Type check all

# ✅ Test
turbo run test                   # Run all tests
turbo run test --filter=configconv
```

### Custom Scripts

```json
{
  "scripts": {
    "dev:desktop": "turbo run dev --filter=@devil-ai/desktop",
    "dev:server": "turbo run dev --filter=@devil-ai/server",
    "build:ui": "turbo run build --filter=@devil-ai/ui",
    "lint:fix": "turbo run lint -- --fix"
  }
}
```

---

## 8. Best Practices

1. **Use workspace protocol** — `workspace:*` for internal deps
2. **Cache aggressively** — Turborepo caches by default
3. **Use filters** — Run only what you need
4. **Keep tasks consistent** — Same scripts across packages
5. **Use dependsOn** — Define correct build order
6. **Monitor cache** — Use `--dry` to see what's cached
7. **Use global deps** — Lock files, env vars
8. **Keep packages focused** — One responsibility per package
9. **Document dependencies** — Keep package.json clean
10. **Use CI caching** — Speed up CI/CD pipelines
