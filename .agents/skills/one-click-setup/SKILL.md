---
name: one-click-setup
description: Project setup automation. Boilerplate generation, dependency installation, configuration.
---

# One-Click Setup

## When to Apply
Use this skill when bootstrapping new projects, setting up scaffolding, or automating initial configuration for new team members.

## Core Concepts
- **Template engines**: EJS, Handlebars, Plop.js for code generation
- **Scaffolding patterns**: Directory structure, config files, boilerplate
- **Dependency bootstrapping**: Automated install after project creation
- **Configuration generators**: ESLint, TypeScript, Tailwind configs
- **Interactive CLIs**: Prompt-based setup wizards

## Implementation
```bash
# Initialize new project with Bun
bun create vite my-app --template react-ts

# Template-based scaffolding with Plop
bunx plop component -- --name Button

# Auto-install after generation
bun install && bun run dev

# Copy template with variable substitution
cp -r template/ project/ && \
  sed -i 's/{{name}}/my-app/g' project/package.json

# Git init and initial commit
git init && git add -A && git commit -m "Initial scaffold"
```

## Best Practices
- Store templates in a `/templates` directory with clear naming
- Use `package.json` scripts for setup commands (`bun run setup`)
- Document the setup process in README.md
- Support both interactive and non-interactive modes
- Validate generated files with type-checking and linting
- Include `.gitignore` and `.env.example` in templates
