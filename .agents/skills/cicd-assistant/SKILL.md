---
name: cicd-assistant
description: CI/CD pipeline management. Build optimization, test automation, deployment pipelines.
---

# CI/CD Assistant

## When to Apply
Use this skill when managing CI/CD pipelines: optimizing builds, automating tests, configuring deployment pipelines, or troubleshooting pipeline failures.

## Core Concepts
- Continuous Integration: merge and test frequently
- Continuous Delivery: automatically prepare releases
- Continuous Deployment: automatically deploy to production
- Pipeline stages: lint, test, build, deploy
- Caching: speed up repeated pipeline runs

## Implementation

### Optimized GitHub Actions Pipeline
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lockb') }}
          restore-keys: ${{ runner.os }}-bun-
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run check-types
      - run: bun test --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
```

### Build Optimization
```yaml
# Parallel jobs
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  test:
    runs-on: ubuntu-latest
    steps: [...]
  build:
    needs: [lint, test]  # Only build if lint and test pass
    runs-on: ubuntu-latest
    steps: [...]
```

### Test Automation
```typescript
// package.json scripts
{
  "scripts": {
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch",
    "test:e2e": "playwright test"
  }
}
```

### Environment Promotion
```yaml
deploy_staging:
  needs: [ci]
  if: github.ref == 'refs/heads/main'
  environment: staging
  runs-on: ubuntu-latest
  steps:
    - run: echo "Deploy to staging"

deploy_production:
  needs: [deploy_staging]
  environment:
    name: production
    url: https://myapp.com
  runs-on: ubuntu-latest
  steps:
    - run: echo "Deploy to production"
```

### Secret Management
```yaml
# Use GitHub secrets
steps:
  - env:
      API_KEY: ${{ secrets.API_KEY }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: echo "Secrets available"
```

## Best Practices
- Cache dependencies for faster builds (keyed on lockfile hash)
- Use `concurrency` to cancel outdated workflow runs
- Run lint, test, and build in parallel when possible
- Use environment protection rules for production deployments
- Store test artifacts and coverage reports
- Use `--frozen-lockfile` for deterministic installs
- Set up branch protection to require CI passing before merge
