---
name: docker-patterns
description: Dockerfile optimization, multi-stage builds, container security, docker-compose patterns, and containerization best practices for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Docker Patterns

Docker and containerization patterns for the Devil AI codebase.

## When to Apply

- Creating Dockerfiles
- Optimizing container builds
- Setting up docker-compose
- Securing containers
- Managing multi-stage builds

---

## 1. Dockerfile Best Practices

### Basic Dockerfile

```dockerfile
# ✅ Optimized Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Multi-Stage Build

```dockerfile
# ✅ Multi-stage build for Node.js
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Bun Dockerfile

```dockerfile
# ✅ Optimized for Bun
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

---

## 2. Docker Ignore

### .dockerignore

```dockerignore
# ✅ .dockerignore
node_modules
npm-debug.log*
dist
build
.git
.gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage
.nyc_output
*.md
LICENSE
.vscode
.idea
*.swp
*.swo
```

---

## 3. Docker Compose

### Basic Compose

```yaml
# ✅ docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Development Compose

```yaml
# ✅ docker-compose.dev.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: bun run dev

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Development Dockerfile

```dockerfile
# ✅ Dockerfile.dev
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
CMD ["bun", "run", "dev"]
```

---

## 4. Container Security

### Non-Root User

```dockerfile
# ✅ Run as non-root user
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --chown=nextjs:nodejs . .
USER nextjs
CMD ["node", "dist/index.js"]
```

### Read-Only Filesystem

```dockerfile
# ✅ Read-only filesystem
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app
COPY --chown=nextjs:nodejs . .
RUN chmod -R 555 /app
USER nextjs
CMD ["node", "dist/index.js"]
```

### No Latest Tag

```dockerfile
# ✅ Use specific versions
FROM node:20.11.0-alpine
FROM postgres:16.1-alpine
FROM redis:7.2.3-alpine
```

### Scan for Vulnerabilities

```bash
# ✅ Scan image for vulnerabilities
docker scan myapp:latest
trivy image myapp:latest
```

---

## 5. Health Checks

### Dockerfile Health Check

```dockerfile
# ✅ Health check in Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm run build
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Compose Health Check

```yaml
# ✅ Health check in docker-compose
services:
  app:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

---

## 6. Volume Management

### Named Volumes

```yaml
# ✅ Named volumes for persistence
services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Bind Mounts

```yaml
# ✅ Bind mounts for development
services:
  app:
    volumes:
      - .:/app
      - /app/node_modules  # Anonymous volume to preserve node_modules
```

### Volume Permissions

```dockerfile
# ✅ Fix volume permissions
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app
COPY --chown=nextjs:nodejs . .
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
VOLUME /app/data
USER nextjs
```

---

## 7. Networking

### Custom Networks

```yaml
# ✅ Custom networks
services:
  app:
    networks:
      - frontend
      - backend
  
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

### Service Discovery

```yaml
# ✅ Service discovery via DNS
services:
  app:
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
```

---

## 8. Environment Variables

### Environment Files

```bash
# ✅ .env file
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

```yaml
# ✅ Use env_file in docker-compose
services:
  app:
    env_file:
      - .env
```

### Environment Variables in Dockerfile

```dockerfile
# ✅ Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=postgresql://user:password@db:5432/mydb
```

---

## 9. Build Optimization

### Layer Caching

```dockerfile
# ✅ Optimize layer caching
FROM node:20-alpine
WORKDIR /app

# Copy package files first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code (rebuilds only this layer)
COPY . .
RUN npm run build
```

### Build Args

```dockerfile
# ✅ Build arguments
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine
WORKDIR /app
COPY . .
RUN npm run build
```

```bash
# ✅ Pass build args
docker build --build-arg NODE_VERSION=20 -t myapp .
```

### Build Targets

```dockerfile
# ✅ Multi-target build
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
```

```bash
# ✅ Build specific target
docker build --target production -t myapp:prod .
```

---

## 10. Commands

### Common Docker Commands

```bash
# ✅ Build image
docker build -t myapp .

# ✅ Run container
docker run -p 3000:3000 myapp

# ✅ Run in background
docker run -d -p 3000:3000 myapp

# ✅ View logs
docker logs <container_id>

# ✅ Execute command in container
docker exec -it <container_id> sh

# ✅ Stop container
docker stop <container_id>

# ✅ Remove container
docker rm <container_id>

# ✅ Remove image
docker rmi myapp

# ✅ Docker compose up
docker-compose up -d

# ✅ Docker compose down
docker-compose down
```

---

## Best Practices

1. **Use multi-stage builds** — Smaller production images
2. **Use specific tags** — Never use `:latest`
3. **Run as non-root** — Security best practice
4. **Use .dockerignore** — Exclude unnecessary files
5. **Order layers properly** — Cache dependencies first
6. **Health checks** — Monitor container health
7. **Use volumes** — Persist data
8. **Scan for vulnerabilities** — Regular security scans
9. **Use docker-compose** — Manage multi-container apps
10. **Document usage** — Clear README for Docker setup
