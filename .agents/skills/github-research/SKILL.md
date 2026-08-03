---
name: github-research
description: GitHub repository research. Covers trending repos, code analysis, dependency audit, license checking, contributor analysis.
---

# GitHub Research

## When to Apply
Use this skill when researching GitHub repositories, analyzing codebases, auditing dependencies, or evaluating open-source projects for adoption or contribution.

## Core Concepts
- Repository Analysis: Code quality, activity, community health
- Dependency Audit: Security vulnerabilities, license compatibility
- Contributor Analysis: Activity, responsiveness, bus factor
- Code Metrics: Complexity, test coverage, documentation quality
- License Compliance: Understanding and compliance requirements
- Fork Analysis: Derivative works, patches, maintenance status
- Issue/PR Analysis: Response time, resolution rate, maintainers
- Trending Analysis: Emerging projects, technology adoption

## Implementation
```bash
# GitHub CLI commands
gh repo list --language=typescript --sort=stars --limit=10
gh repo view owner/repo
gh api repos/owner/repo
gh api repos/owner/repo/contributors
gh api repos/owner/repo/issues?state=open
gh api repos/owner/repo/pulls?state=closed

# Dependency audit
npm audit
npm audit --json
yarn audit
pip audit
bundler-audit

# License checking
license-checker --summary
license-checker --failOn "GPL-3.0;AGPL-3.0"

# Code analysis
cloc .  # Lines of code
scc .   # Complex code counter
tokei . # Statistics

# Repository health indicators
gh api repos/owner/repo | jq '{stars: .stargazers_count, forks: .forks_count, open_issues: .open_issues_count, created: .created_at, updated: .updated_at, license: .license.spdx_id}'
```

## Best Practices
- Check repository activity (commits in last 6 months)
- Evaluate maintainer responsiveness to issues/PRs
- Review license compatibility with your project
- Audit dependencies for known vulnerabilities
- Check test coverage and CI/CD setup
- Look at fork count and derivative works
- Review documentation quality and completeness
- Analyze code quality with static analysis tools
- Check for archived or unmaintained status
- Review security policy and vulnerability reporting
- Examine release frequency and versioning
- Consider community size and contributor diversity