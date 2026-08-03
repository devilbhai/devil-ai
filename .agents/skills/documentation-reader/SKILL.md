---
name: documentation-reader
description: Technical documentation reading. Covers API docs, README analysis, changelog parsing, version comparison, migration guides.
---

# Documentation Reader

## When to Apply
Use this skill when reading technical documentation, analyzing API references, parsing changelogs, or comparing versions of libraries and frameworks.

## Core Concepts
- API Documentation: Endpoints, parameters, responses
- README Analysis: Project overview, setup, usage
- Changelog Parsing: Version history, breaking changes
- Migration Guides: Version upgrades, deprecations
- Documentation Standards: OpenAPI, RAML, API Blueprint
- Code Examples: Usage patterns, best practices
- Version Comparison: Features, compatibility, support
- Documentation Quality: Completeness, accuracy, currency

## Implementation
```bash
# Documentation tools
# Read API documentation
curl -s https://api.example.com/openapi.json | jq .

# Parse changelog
cat CHANGELOG.md | head -100

# Compare versions
diff <(npm view package@1.0.0) <(npm view package@2.0.0)

# Extract API endpoints
grep -r "@(Get|Post|Put|Delete|Patch)" src/ --include="*.ts"

# Generate documentation
typedoc --out docs src/

# Documentation validation
redoc-cli lint openapi.json
```

```markdown
# Documentation Structure

## API Reference
### Endpoints
- GET /api/resource
- POST /api/resource

### Authentication
- Bearer token
- API key

### Rate Limiting
- 100 requests/minute

## Changelog
### v2.0.0 (2024-01-15)
#### Breaking Changes
- Removed deprecated endpoint /old
#### New Features
- Added batch operations
#### Bug Fixes
- Fixed pagination issue
```

## Best Practices
- Always check documentation version matches your library version
- Read migration guides before upgrading
- Look for breaking changes in changelogs
- Verify API examples are up-to-date
- Check for deprecated features before using them
- Cross-reference multiple documentation sources
- Look for official SDKs or client libraries
- Check community forums for common issues
- Document your own API usage patterns
- Keep notes on important documentation findings
- Use documentation search effectively
- Report documentation issues to maintainers