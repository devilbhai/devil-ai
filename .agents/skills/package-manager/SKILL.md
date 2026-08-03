---
name: package-manager
description: Package management. npm/yarn/pnpm/bun workflows, version resolution, caching.
---

# Package Manager

## When to Apply
Use this skill when managing packages, resolving version conflicts, optimizing installs, or configuring package manager settings.

## Core Concepts
- **Workspace protocols**: `workspace:*` for monorepo linking
- **Version resolution**: Semver ranges, overrides, resolutions
- **Caching strategies**: Global cache, offline mirrors, content-addressable storage
- **Dependency hoisting**: Controlled vs flat node_modules structures
- **Lock file integrity**: Ensuring reproducible installs across environments

## Implementation
```bash
# Add dependency with version range
bun add <package>@^2.0.0

# Add dev dependency
bun add -D <package>

# Workspace dependency (linked)
bun add <package> --workspace

# Force resolution override
# In package.json:
"overrides": { "old-package": "new-package" }

# Clean install (wipe cache + reinstall)
rm -rf node_modules bun.lock && bun install

# Verify lockfile integrity
bun install --frozen-lockfile
```

## Best Practices
- Use `bun.lock` (not `bun.lockb`) for readable lockfiles in monorepos
- Prefer `bun add` over manual package.json edits
- Run `bun install` in CI with `--frozen-lockfile`
- Use workspace dependencies for shared packages
- Keep dependencies minimal — audit regularly with `bun why`
- Use `bun link` for local development of shared packages
