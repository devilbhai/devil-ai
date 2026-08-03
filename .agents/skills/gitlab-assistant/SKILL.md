---
name: gitlab-assistant
description: GitLab platform features. Pipeline management, issue tracking, merge requests.
---

# GitLab Assistant

## When to Apply
Use this skill when working with GitLab: managing CI/CD pipelines, tracking issues, handling merge requests, or using GitLab-specific features.

## Core Concepts
- `.gitlab-ci.yml`: pipeline configuration
- Merge Requests (MR): code review and merge workflow
- GitLab CI/CD: stages, jobs, runners, artifacts
- Issues and Epics: project and group-level tracking
- GitLab API: REST and GraphQL interfaces

## Implementation

### GitLab CI/CD Pipeline
```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  BUN_VERSION: "1.3.8"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .bun/

lint:
  stage: lint
  image: oven/bun:latest
  script:
    - bun install --frozen-lockfile
    - bun run lint
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

typecheck:
  stage: test
  image: oven/bun:latest
  script:
    - bun install --frozen-lockfile
    - bun run check-types

test:
  stage: test
  image: oven/bun:latest
  script:
    - bun install --frozen-lockfile
    - bun test
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'

build:
  stage: build
  image: oven/bun:latest
  script:
    - bun run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy_staging:
  stage: deploy
  script:
    - echo "Deploying to staging..."
  environment:
    name: staging
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### GitLab API Usage
```bash
# List merge requests
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened"

# Create issue via API
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$CI_API_V4_URL/projects/$CI_PROJECT_ID/issues" \
  --data "title=Bug+report&description=Steps+to+reproduce..."
```

### Merge Request Best Practices
```markdown
## Description
Brief summary of changes.

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Tests pass locally
- [ ] New tests added (if applicable)
```

### Pipeline Rules
```yaml
# Only run on merge requests and main branch
rules:
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# Run only on tags
deploy:
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
```

## Best Practices
- Use `rules` over `only/except` for newer, more flexible control
- Cache dependencies between pipeline runs for speed
- Use `needs` for DAG-based parallel job execution
- Protect default branch with merge request approvals
- Use GitLab Variables for secrets (Settings > CI/CD > Variables)
- Set `interruptible: true` on jobs to cancel outdated pipelines
