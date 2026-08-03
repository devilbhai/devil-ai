---
name: dependency-checker
description: Dependency analysis. Vulnerability scanning, license checking, update recommendations.
---

# Dependency Checker

## When to Apply
Use this skill when analyzing project dependencies for vulnerabilities, license compliance, outdated packages, or before adding new dependencies.

## Core Concepts
- **Vulnerability scanning**: Identify known CVEs in dependencies
- **License compliance**: Detect problematic licenses (GPL, AGPL) in dependency tree
- **Update recommendations**: Suggest safe upgrades with changelog review
- **Deprecation detection**: Find deprecated packages before they break builds
- **Supply chain analysis**: Evaluate package maintainers and download patterns

## Implementation
```bash
# Bun dependency audit
bun audit

# Check for outdated packages
bun outdated

# Analyze specific dependency tree
bun why <package>

# License check
npx license-checker --summary

# Combine for full analysis
bun audit --json | jq '.advisories | length'
bun outdated --json | jq '[.[] | select(.current != .latest)] | length'
```

## Best Practices
- Run dependency checks before every merge to main
- Pin dependency versions in production apps
- Use `bun.lock` for reproducible installs
- Review transitive dependencies, not just direct ones
- Check for typosquatting when adding new packages
- Prefer packages with active maintainers and regular releases
