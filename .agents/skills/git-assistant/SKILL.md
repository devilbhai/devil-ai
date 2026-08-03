---
name: git-assistant
description: Git workflow assistance. Branch management, conflict resolution, history analysis.
---

# Git Assistant

## When to Apply
Use this skill when working with Git: managing branches, resolving conflicts, analyzing history, or automating Git workflows.

## Core Concepts
- Branching: feature branches, main/develop, release branches
- Commit conventions: conventional commits (feat:, fix:, chore:)
- Merge strategies: merge commit, squash, rebase
- Interactive rebase: rewriting commit history
- Bisect: binary search through commits to find bugs

## Implementation

### Branch Management
```bash
# Create and switch to feature branch
git checkout -b feat/new-feature

# List branches
git branch -a

# Delete merged branch
git branch -d feat/old-feature

# Rename branch
git branch -m old-name new-name
```

### Conflict Resolution
```bash
# See conflicting files
git status

# Resolve with theirs/theirs
git checkout --theirs <file>
git checkout --ours <file>

# Use merge tool
git mergetool

# After resolving
git add <resolved-file>
git commit -m "resolve: merge conflicts"
```

### History Analysis
```bash
# Visual log
git log --oneline --graph --all

# Find who changed a line
git blame file.ts

# Find when a bug was introduced
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>

# Show file history
git log --follow -p file.ts

# Stats for a range
git diff --stat main..feature
```

### Interactive Rebase
```bash
# Rewrite last 3 commits
git rebase -i HEAD~3

# Commands in editor:
# pick   = keep commit
# reword = keep commit, edit message
# squash = meld into previous commit
# fixup  = like squash, discard message
# drop   = remove commit
```

### Commit Conventions
```bash
# feat:     new feature
# fix:      bug fix
# docs:     documentation changes
# style:    formatting, no code change
# refactor: code restructuring
# test:     adding tests
# chore:    maintenance tasks
# perf:     performance improvement
# ci:       CI/CD changes
# build:    build system changes

git commit -m "feat(auth): add OAuth2 login flow"
git commit -m "fix(api): handle empty response from upstream"
```

### Useful Aliases
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.unstage "reset HEAD --"
```

## Best Practices
- Use feature branches for all non-trivial changes
- Write clear, conventional commit messages
- Rebase feature branches before merging for clean history
- Use `git stash` for temporary work-in-progress saves
- Review `git diff --staged` before committing
- Never force-push to shared branches
