---
name: ci-cd-pipeline
description: CI/CD pipeline design - GitHub Actions, Jenkins, GitLab CI, automated testing, deployment strategies.
---

# CI/CD Pipeline

## When to Apply
Use this skill when building CI/CD pipelines, automating deployments, setting up testing automation, or configuring release workflows.

## Core Concepts
- Pipeline stages (build, test, deploy)
- Parallel execution for speed
- Caching strategies
- Environment variables and secrets
- Deployment strategies (blue-green, canary, rolling)
- Rollback mechanisms
- Infrastructure as Code integration

## GitHub Actions Pattern
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: npm run build
    - run: npm run deploy
```

## Best Practices
- Run tests on every PR
- Cache dependencies between runs
- Use matrix builds for multi-platform
- Separate build and deploy jobs
- Use environments for approvals
- Store artifacts for debugging
- Implement automatic rollback on failure
- Use semantic versioning

## Deployment Strategies
- Blue-Green: Two identical environments, switch traffic
- Canary: Gradually roll out to small percentage
- Rolling: Update instances incrementally
- Feature Flags: Deploy behind flags, enable gradually

## Security
- Never hardcode secrets
 OIDC for cloud provider auth
- Dependabot for dependency updates
- SAST/DAST in pipeline
- Signed commits and artifacts
