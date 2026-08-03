---
name: graphify
description: >-
  Knowledge graph skill for Devil AI. Query the project knowledge graph
  before reading files directly. Use graphify query for codebase questions,
  graphify path for connection tracing, and graphify explain for concept deep-dives.
license: MIT
metadata:
  author: safishamsi
  version: "8.0.0"
---

# Graphify — Knowledge Graph Skill

Your project has a knowledge graph built by Graphify. It maps code, docs, architecture, and relationships into a queryable graph. **Always query the graph first** before reading files directly.

## When to Use

- Answering questions about codebase architecture
- Finding how modules connect or trace call flows
- Understanding unfamiliar code areas
- Reviewing changes for impact
- Onboarding to a new project

## Commands

### Query the graph
```bash
graphify query "what connects auth to the database?"
graphify query "show the authentication flow"
graphify query "what are the god nodes in this project?"
```

### Trace paths between concepts
```bash
graphify path "UserService" "DatabasePool"
graphify path "LoginPage" "APIHandler"
```

### Explain a concept
```bash
graphify explain "RateLimiter"
graphify explain "WebSocketManager"
```

### Read the report (for broad architecture review)
```bash
cat graphify-out/GRAPH_REPORT.md
```

### View the interactive graph
```bash
open graphify-out/graph.html
```

## Priority Rules

1. **Always query first** — Use `graphify query` before reading source files
2. **Use scoped queries** — Prefer `graphify query "<question>"` over reading the full report
3. **Trace connections** — Use `graphify path` to understand how modules relate
4. **Deep-dive concepts** — Use `graphify explain` for detailed understanding
5. **Fallback to files** — Only read files directly if the graph doesn't have the answer

## Example Workflow

User: "How does the authentication system work?"

Agent should:
1. `graphify query "authentication system flow"` — Get the big picture
2. `graphify path "LoginPage" "AuthMiddleware"` — Trace the flow
3. `graphify explain "AuthMiddleware"` — Deep-dive the key component
4. Read specific files only if the graph output is insufficient

## Graph Output Location

The knowledge graph is stored in `graphify-out/`:
- `graph.html` — Interactive visualization (open in browser)
- `GRAPH_REPORT.md` — Highlights, god nodes, surprising connections
- `graph.json` — Full graph data for programmatic queries

## Rebuilding the Graph

After significant code changes, rebuild:
```bash
graphify . --no-viz        # rebuild without HTML visualization
graphify . --update         # update only changed files
```
