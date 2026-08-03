---
name: code-reviewer
description: Code review automation. Style checking, best practice validation, security scanning.
---

# Code Reviewer

## When to Apply
Use this skill when automating code reviews: checking style compliance, validating best practices, scanning for security issues, or providing review feedback.

## Core Concepts
- Linting: ESLint, Biome for style and error detection
- Type checking: TypeScript strict mode catches type-related issues
- Security scanning: Snyk, CodeQL, Semgrep for vulnerability detection
- Best practices: complexity metrics, duplication detection, test coverage
- Automated review: PR comments, inline suggestions, status checks

## Implementation

### Style Checking with Biome
```bash
# Check formatting and linting
bunx biome check .

# Auto-fix issues
bunx biome check --write .

# Check specific file
bunx biome check src/index.ts
```

### TypeScript Strict Checking
```bash
# Run type checker
tsc --noEmit

# Strict mode checks
tsc --noEmit --strict --noUnusedLocals --noUnusedParameters
```

### Security Scanning
```bash
# Audit dependencies
bun audit
npm audit

# Check for secrets in code
grep -rn "password\|secret\|api_key\|token" --include="*.ts" --include="*.js" src/

# Static analysis with semgrep
semgrep --config=auto .
```

### Code Quality Metrics
```typescript
interface ReviewResult {
  file: string
  issues: Array<{
    line: number
    severity: "error" | "warning" | "info"
    message: string
    rule: string
  }>
  metrics: {
    complexity: number
    duplication: string
    testCoverage: number
  }
}

function reviewCode(filePath: string): ReviewResult {
  // Run linters and analyzers
  // Aggregate results into ReviewResult
  return { file: filePath, issues: [], metrics: { complexity: 0, duplication: "0%", testCoverage: 0 } }
}
```

### Automated Review Comments
```typescript
function formatReviewComment(issue: Issue): string {
  const icons = { error: "❌", warning: "⚠️", info: "ℹ️" }
  return `${icons[issue.severity]} **${issue.rule}**: ${issue.message} (line ${issue.line})`
}
```

## Best Practices
- Run linting and type checking in CI before manual review
- Configure linter rules collaboratively with the team
- Focus security review on authentication, input validation, and data handling
- Set minimum test coverage thresholds (e.g., 80%)
- Use `complexity` metric to flag functions needing refactoring
- Review generated code with same scrutiny as hand-written code
