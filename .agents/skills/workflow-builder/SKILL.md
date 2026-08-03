---
name: workflow-builder
description: Workflow automation design. Pipeline creation, conditional logic, error handling, retry patterns.
---

# Workflow Builder

## When to Apply
Use when designing automation pipelines, creating CI/CD workflows, building data processing chains, or when tasks need to be orchestrated in sequence with error handling.

## Core Concepts
- **Pipeline design**: Sequence of steps with clear inputs/outputs
- **Conditional branching**: Different paths based on conditions
- **Error handling**: Graceful failure and recovery strategies
- **Retry patterns**: Automatic retry with backoff for transient failures
- **Parallel execution**: Running independent steps concurrently
- **State management**: Maintaining workflow state across steps

## Implementation
```
1. Define workflow trigger and inputs
2. Map out step sequence and dependencies
3. Add conditional logic for branching paths
4. Implement error handling for each step
5. Add retry logic for transient failures
6. Define outputs and side effects
7. Test with various input scenarios
```

## Best Practices
- Make each step idempotent where possible
- Add logging at each step for debugging
- Use timeouts to prevent hanging workflows
- Implement circuit breakers for external dependencies
- Design for observability - log inputs, outputs, and timing
