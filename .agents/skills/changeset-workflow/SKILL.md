---
name: changeset-workflow
description: Changeset versioning workflow, linked packages, release management, and changelog generation for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Changeset Workflow Patterns

Changeset versioning workflow for the Devil AI monorepo.

## When to Apply

- Creating changesets
- Managing versions
- Generating changelogs
- Publishing packages
- Handling linked packages

---

## 1. Setup

### Installation

```bash
# ✅ Install changesets
bun add -D @changesets/cli

# ✅ Initialize changesets
bunx changeset init
```

### Configuration

```json
// ✅ .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "devil-ai/desktop" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [
    ["@devil-ai/desktop", "@devil-ai/ui", "@devil-ai/configconv"]
  ],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

## 2. Creating Changesets

### Interactive Mode

```bash
# ✅ Create changeset
bunx changeset

# Follow prompts:
# 1. Select packages to change
# 2. Select bump type (patch/minor/major)
# 3. Write description
```

### Manual Mode

```markdown
// ✅ .changeset/short-feature.md
---
"@devil-ai/ui": minor
"@devil-ai/desktop": patch
---

Added new Button component variants
```

### Changeset Types

```markdown
# ✅ Patch (bug fixes)
---
"@devil-ai/ui": patch
---

Fixed Button hover state

# ✅ Minor (new features)
---
"@devil-ai/ui": minor
---

Added new Button variant

# ✅ Major (breaking changes)
---
"@devil-ai/ui": major
---

Removed deprecated Button variant
```

---

## 3. Version Management

### Apply Changesets

```bash
# ✅ Apply changesets and update versions
bunx changeset version

# ✅ This will:
# 1. Read all changesets
# 2. Update package versions
# 3. Generate changelog entries
# 4. Delete changeset files
```

### Version Commands

```bash
# ✅ Preview version changes
bunx changeset version --dry-run

# ✅ Apply changesets
bunx changeset version

# ✅ Update specific package
bunx changeset version @devil-ai/ui
```

---

## 4. Changelog Generation

### Changelog Format

```markdown
# @devil-ai/ui

## 1.2.0

### Minor Changes

- Added new Button component variants ([#123](https://github.com/devil-ai/desktop/pull/123))

### Patch Changes

- Fixed Button hover state ([#124](https://github.com/devil-ai/desktop/pull/124))

## 1.1.0

### Minor Changes

- Added Input component ([#120](https://github.com/devil-ai/desktop/pull/120))
```

### Changelog Configuration

```json
// ✅ .changeset/config.json
{
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "devil-ai/desktop" }
  ]
}
```

---

## 5. Linked Packages

### Linked Versioning

```json
// ✅ .changeset/config.json
{
  "linked": [
    ["@devil-ai/desktop", "@devil-ai/ui", "@devil-ai/configconv"]
  ]
}
```

### How It Works

```
✅ When one package in a linked group gets a version bump:
- All packages in the group get the same bump type
- Versions stay synchronized
- Example: If ui gets minor, all get minor
```

### Fixed Versioning

```json
// ✅ Fixed versioning (always same version)
{
  "fixed": [
    ["@devil-ai/desktop", "@devil-ai/ui"]
  ]
}
```

---

## 6. Publishing

### npm Publishing

```bash
# ✅ Publish packages
bunx changeset publish

# ✅ Or publish specific package
bunx changeset publish @devil-ai/ui

# ✅ Dry run
bunx changeset publish --dry-run
```

### GitHub Releases

```bash
# ✅ Create GitHub releases
bunx changeset tag

# ✅ Push tags
git push --follow-tags
```

### CI/CD Publishing

```yaml
# ✅ .github/workflows/publish.yml
name: Publish

on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          bun-version: latest
          registry-url: "https://registry.npmjs.org"
      
      - run: bun install --frozen-lockfile
      - run: bun run build
      
      - name: Create Release PR
        uses: changesets/action@v1
        with:
          publish: bunx changeset publish
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 7. Git Workflow

### Before PR

```bash
# ✅ 1. Make changes
# ✅ 2. Create changeset
bunx changeset
# ✅ 3. Commit changes
git add .
git commit -m "feat: add new feature"
# ✅ 4. Push
git push
```

### During Review

```bash
# ✅ Reviewer checks:
# 1. Changeset exists
# 2. Version bump is correct
# 3. Changelog description is clear
# 4. Breaking changes are documented
```

### After Merge

```bash
# ✅ 1. Merge PR
# ✅ 2. Apply changesets
bunx changeset version
# ✅ 3. Push version changes
git push
# ✅ 4. Publish (if needed)
bunx changeset publish
```

---

## 8. Best Practices

1. **Create changeset for every PR** — Required for versioning
2. **Use correct bump type** — patch/minor/major
3. **Write clear descriptions** — Help users understand changes
4. **Document breaking changes** — Always use major bump
5. **Review changesets** — Check during PR review
6. **Use linked packages** — Keep related packages in sync
7. **Automate publishing** — Use CI/CD
8. **Monitor changelog** — Ensure it's generated correctly
9. **Test before publish** — Run full test suite
10. **Communicate releases** — Announce major changes
