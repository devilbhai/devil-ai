---
name: git-workflow
description: Git workflow patterns, conventional commits, branching strategies, PR reviews, and merge strategies for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Git Workflow Patterns

Git workflow patterns for the Devil AI codebase.

## When to Apply

- Creating commits
- Writing commit messages
- Creating branches
- Reviewing pull requests
- Merging changes

---

## 1. Commit Messages

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add login with Google` |
| `fix` | Bug fix | `fix(chat): resolve message duplication` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Formatting (no code change) | `style(ui): fix indentation` |
| `refactor` | Code restructuring | `refactor(api): extract validation middleware` |
| `perf` | Performance improvement | `perf(render): memoize message list` |
| `test` | Adding tests | `test(auth): add login flow tests` |
| `build` | Build system | `build(vite): update to v5` |
| `ci` | CI/CD | `ci(github): add type checking step` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `revert` | Revert commit | `revert: revert "feat(auth): add login"` |

### Scopes

Common scopes for this project:

- `auth` — Authentication/authorization
- `api` — Backend API
- `ui` — UI components
- `chat` — Chat functionality
- `session` — Session management
- `electron` — Electron main/preload
- `server` — Hono backend
- `configconv` — Config converter

### Examples

```
feat(chat): add message streaming support

- Implement SSE connection for real-time responses
- Add typing indicator during stream
- Handle connection errors gracefully

Closes #123
```

```
fix(auth): prevent token refresh race condition

Previously, multiple concurrent requests could trigger
duplicate token refreshes, causing 401 errors.

Fix by queuing refresh requests and sharing the promise.
```

```
refactor(api): extract user service from routes

Move user-related business logic to UserService for
better separation of concerns and testability.
```

---

## 2. Branching Strategy

### Branch Naming

```
feat/feature-name
fix/bug-description
docs/documentation-update
refactor/refactoring-description
test/test-description
chore/maintenance-description
```

### Branch Types

| Branch | Purpose | Merges Into |
|--------|---------|-------------|
| `main` | Production-ready code | — |
| `develop` | Integration branch | `main` |
| `feat/*` | New features | `develop` |
| `fix/*` | Bug fixes | `develop` or `main` |
| `hotfix/*` | Critical production fixes | `main` + `develop` |

### Workflow

```
main
  ↑
  |--- hotfix/critical-fix
  |
develop
  ↑
  |--- feat/new-feature
  |--- fix/bug-fix
  |--- docs/update-readme
```

---

## 3. Pull Requests

### PR Title Format

```
<type>(<scope>): <description>
```

Same as commit message format.

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?

Describe tests run:
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
```

### PR Best Practices

1. **Small, focused PRs** — One feature/fix per PR
2. **Clear description** — What and why, not just what
3. **Screenshots/videos** — For UI changes
4. **Link issues** — `Closes #123`
5. **Self-review** — Review your own PR first
6. **Respond to feedback** — Address all comments

---

## 4. Code Review

### Review Checklist

- [ ] **Code quality** — Clean, readable, maintainable
- [ ] **Tests** — Adequate coverage, edge cases
- [ ] **Performance** — No unnecessary re-renders, memory leaks
- [ ] **Security** — No vulnerabilities, proper auth
- [ ] **Accessibility** — ARIA, keyboard navigation
- [ ] **Error handling** — Graceful degradation
- [ ] **Documentation** — Updated if needed

### Review Comments

```markdown
# Suggestion (non-blocking)
Suggesting a different approach here...

# Issue (blocking)
This needs to be fixed before merging.

# Question
Can you explain why this approach was chosen?

# Nit (non-blocking)
Minor style issue...
```

### Responding to Reviews

- Thank reviewers for their time
- Address all comments
- Resolve conversations when done
- Push new commits, don't force push
- Re-request review after changes

---

## 5. Merge Strategies

### Squash and Merge (Default)

```bash
# Squash all commits into one
git checkout develop
git merge --squash feat/new-feature
git commit -m "feat(scope): description"
```

**When to use:**
- Feature branches with many small commits
- Clean history desired
- Single logical change

### Merge Commit

```bash
# Preserve all commits
git checkout develop
git merge feat/new-feature
```

**When to use:**
- Large features with meaningful commit history
- Multiple related changes

### Rebase

```bash
# Rebase feature branch onto develop
git checkout feat/new-feature
git rebase develop
git checkout develop
git merge feat/new-feature
```

**When to use:**
- Clean up commit history
- Update feature branch with latest changes

---

## 6. Git Hooks

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run linter
bun run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Run type check
bun run check-types
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Commit Message Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg

# Validate conventional commit format
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,72}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "❌ Invalid commit message format"
  echo "Expected: <type>(<scope>): <description>"
  echo "Example: feat(auth): add login with Google"
  exit 1
fi

echo "✅ Commit message format valid"
```

---

## 7. Common Commands

### Daily Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feat/feature-name

# Work on feature
git add .
git commit -m "feat(scope): description"

# Keep up to date
git fetch origin
git rebase origin/develop

# Push and create PR
git push origin feat/feature-name
```

### Syncing Fork

```bash
# Add upstream remote
git remote add upstream https://github.com/original/repo.git

# Fetch upstream
git fetch upstream

# Merge upstream into main
git checkout main
git merge upstream/main

# Push to fork
git push origin main
```

### Undoing Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific file
git checkout HEAD -- file.txt

# Revert a commit (creates new commit)
git revert <commit-hash>
```

---

## 8. Tags and Releases

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR — Breaking changes
MINOR — New features (backward compatible)
PATCH — Bug fixes (backward compatible)
```

### Creating Tags

```bash
# Lightweight tag
git tag v1.0.0

# Annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin v1.0.0
```

### Release Notes

```markdown
## v1.0.0 (2025-01-15)

### Features
- feat(auth): add login with Google (#123)
- feat(chat): add message streaming (#124)

### Bug Fixes
- fix(auth): prevent token refresh race condition (#125)
- fix(chat): resolve message duplication (#126)

### Breaking Changes
- api: change user response format (#127)

### Dependencies
- chore(deps): update React to v19 (#128)
```

---

## 9. Git aliases

```bash
# .gitconfig
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  lg = log --oneline --graph --decorate
  last = log -1 HEAD
  unstage = reset HEAD --
  amend = commit --amend --no-edit
  wip = !git add -A && git commit -m 'chore: work in progress'
  sync = !git fetch origin && git rebase origin/$(git branch --show-current)
```

---

## 10. Best Practices

1. **Commit often** — Small, focused commits
2. **Write clear messages** — Conventional commits format
3. **Keep branches short-lived** — Merge frequently
4. **Review before merge** — Always review PRs
5. **Squash for clean history** — Use squash merge for features
6. **Never force push main** — Protect main branch
7. **Tag releases** — Semantic versioning
8. **Document changes** — Update CHANGELOG
9. **Use `.gitignore`** — Don't commit secrets or build artifacts
10. **Backup branches** — Delete after merge, but keep tags
