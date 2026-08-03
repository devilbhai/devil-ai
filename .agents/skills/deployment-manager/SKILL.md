---
name: deployment-manager
description: Deployment automation. Release management, rollback strategies, health checks.
---

# Deployment Manager

## When to Apply
Use this skill when managing deployments: automating releases, implementing rollback strategies, or performing health checks post-deployment.

## Core Concepts
- Blue-green deployment: two identical environments, swap traffic
- Canary deployment: gradually route traffic to new version
- Rolling update: replace instances one at a time
- Rollback: revert to previous version on failure
- Health checks: liveness, readiness, startup probes

## Implementation

### Deployment Script
```bash
#!/bin/bash
set -euo pipefail

APP_NAME="my-app"
IMAGE_TAG=$1
HEALTH_URL="http://localhost:3000/health"

echo "Deploying ${APP_NAME}:${IMAGE_TAG}..."

# Pull new image
docker pull "${APP_NAME}:${IMAGE_TAG}"

# Stop old container
docker stop "${APP_NAME}" 2>/dev/null || true
docker rm "${APP_NAME}" 2>/dev/null || true

# Start new container
docker run -d --name "${APP_NAME}" -p 3000:3000 "${APP_NAME}:${IMAGE_TAG}"

# Health check with retry
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "$HEALTH_URL" > /dev/null; then
    echo "Deployment successful!"
    exit 0
  fi
  echo "Waiting for health check... ($i/$MAX_RETRIES)"
  sleep 2
done

echo "Health check failed, rolling back..."
docker stop "${APP_NAME}"
docker rm "${APP_NAME}"
docker run -d --name "${APP_NAME}" -p 3000:3000 "${APP_NAME}:previous"
exit 1
```

### GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags: ["v*"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          echo "Deploying version ${GITHUB_REF#refs/tags/v}..."
          # Your deployment commands here
      - name: Health check
        run: |
          for i in $(seq 1 30); do
            if curl -sf https://myapp.com/health; then
              echo "Health check passed"
              exit 0
            fi
            sleep 2
          done
          echo "Health check failed"
          exit 1
```

### Rollback Strategies
```bash
# Kubernetes rollback
kubectl rollout undo deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=3

# Docker rollback (previous image)
docker stop my-app && docker rm my-app
docker run -d --name my-app my-app:previous-tag

# Database migration rollback
bun run migrate:down
```

### Health Check Endpoint
```typescript
import { Hono } from "hono"

const app = new Hono()

app.get("/health", (c) => {
  const checks = {
    database: checkDatabase(),
    redis: checkRedis(),
    memory: checkMemory(),
  }
  const healthy = Object.values(checks).every((c) => c.status === "ok")
  return c.json({ status: healthy ? "ok" : "degraded", checks }, healthy ? 200 : 503)
})
```

## Best Practices
- Always include health checks in deployment pipelines
- Test rollback procedures regularly (not just during incidents)
- Use feature flags for gradual rollouts
- Deploy during low-traffic windows when possible
- Tag deployments with version numbers for traceability
- Monitor error rates and latency post-deployment
