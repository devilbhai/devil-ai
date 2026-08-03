---
name: codebase-analyzer
description: Codebase analysis and understanding. Covers architecture analysis, dependency graphs, code metrics, technical debt assessment.
---

# Codebase Analyzer

## When to Apply
Use this skill when analyzing codebases, understanding architecture, mapping dependencies, or assessing technical debt and code quality.

## Core Concepts
- Architecture Analysis: Patterns, layers, boundaries
- Dependency Graphs: Internal and external dependencies
- Code Metrics: Complexity, duplication, coverage
- Technical Debt: Code smells, maintainability issues
- Module Structure: Organization, coupling, cohesion
- API Surface: Public interfaces, contracts
- Test Coverage: Quality, gaps, flaky tests
- Documentation State: Comments, READMEs, docs

## Implementation
```bash
# Code analysis tools
# Lines of code and complexity
cloc .
tokei .
scc .

# Dependency analysis
npm ls --all
pip freeze
tree /path/to/project

# Code quality
eslint . --format json
prettier --check .
biome check .

# Architecture analysis
# Find entry points
grep -r "main\|index" src/ --include="*.ts" -l

# Find exports
grep -r "export" src/ --include="*.ts" | head -50

# Dependency graph visualization
madge --image graph.svg src/

# Technical debt markers
grep -r "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts"

# Test coverage
jest --coverage
pytest --cov
```

```markdown
# Architecture Analysis Template

## System Overview
- Pattern: [MVC/Microservices/Monolith]
- Framework: [React/Express/Django]
- Database: [PostgreSQL/MongoDB/MySQL]

## Module Structure
- src/core/ - Core business logic
- src/api/ - API endpoints
- src/ui/ - User interface
- src/utils/ - Shared utilities

## Dependencies
### External
- package-a@1.2.3
- package-b@2.0.1

### Internal
- core -> utils (low coupling)
- api -> core (medium coupling)

## Technical Debt
- [ ] TODO: Refactor legacy module
- [ ] FIXME: Performance issue in query
```

## Best Practices
- Start with entry points and trace execution flow
- Map module dependencies to understand coupling
- Identify hot paths and performance bottlenecks
- Look for code duplication and patterns
- Check test coverage for critical paths
- Document architectural decisions and patterns
- Use static analysis for code quality metrics
- Review git history for evolution patterns
- Identify areas with high change frequency
- Look for documentation gaps
- Assess security vulnerabilities in dependencies
- Create architecture diagrams for complex systems