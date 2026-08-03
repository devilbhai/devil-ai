---
name: github-assistant
description: GitHub platform features. Issue management, PR automation, Actions workflow.
---

# GitHub Assistant

**CRITICAL NOTE FOR DEVIL AI AGENTS:** 
When the user wants you to interact with GitHub via Devil AI, check if `$GITHUB_TOKEN` exists in your environment variables. 
If it is MISSING, immediately tell the user: "Please connect GitHub from the Devil AI Connectors page and restart the app."
If it exists, you can use the `gh` CLI as it automatically picks up `$GITHUB_TOKEN`, or use `curl` with `Authorization: Bearer $GITHUB_TOKEN`.

## When to Apply
Use this skill when working with GitHub: managing issues, automating pull requests, creating GitHub Actions workflows, or interacting with the GitHub API.

## Core Concepts
- Issues: bug reports, feature requests, tasks
- Pull Requests: code review, merge workflows
- Actions: CI/CD automation (YAML workflows)
- Code Review: reviewers, approvals, status checks
- GitHub CLI (`gh`): command-line GitHub interaction

## Implementation

### GitHub CLI Usage
```bash
# Create issue
gh issue create --title "Bug: Login fails" --body "Steps to reproduce..." --label bug

# List issues
gh issue list --assignee @me --state open

# Create PR
gh pr create --title "feat: add dark mode" --body "Closes #123"

# View PR
gh pr view 456

# Merge PR
gh pr merge 456 --squash
```

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run check-types

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun test
```

### Issue Templates
```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: Report a bug
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: What happened?
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: How can we reproduce this?
    validations:
      required: true
```

### PR Template
```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->
## Changes
- 

## Related Issues
Closes #

## Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Automate with `gh`
```bash
# Close stale issues
gh issue list --label stale --json number --jq '.[].number' | xargs -I {} gh issue close {}

# Add label to all open issues
gh issue list --json number --jq '.[].number' | xargs -I {} gh issue edit {} --add-label needs-triage

# Auto-merge approved PRs
gh pr list --review "APPROVED" --json number --jq '.[].number' | xargs -I {} gh pr merge {} --squash
```

## Best Practices
- Use branch protection rules to enforce reviews and status checks
- Write descriptive PR titles that explain the change
- Link issues to PRs for traceability (`Closes #123`)
- Use GitHub Actions secrets for credentials (never hardcode)
- Keep workflows fast by caching dependencies
- Use `concurrency` groups to cancel outdated workflow runs
