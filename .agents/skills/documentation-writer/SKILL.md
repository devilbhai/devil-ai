---
name: documentation-writer
description: Documentation generation. API docs, README generation, code comments, changelog.
---

# Documentation Writer

## When to Apply
Use this skill when generating documentation: creating API references, README files, code comments, or changelog entries.

## Core Concepts
- JSDoc/TSDoc for inline code documentation
- README structure: overview, installation, usage, API, examples
- Changelog follows Keep a Changelog format
- API docs from TypeDoc or similar tools
- Examples: minimal, focused, runnable code samples

## Implementation

### JSDoc Documentation
```typescript
/**
 * Calculates the total price including tax.
 *
 * @param items - Array of cart items to price
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns Total price in cents
 * @throws {Error} When items array is empty
 *
 * @example
 * ```ts
 * const total = calculateTotal([{ price: 1000, qty: 2 }], 0.08)
 * // Returns 2160 (cents)
 * ```
 */
function calculateTotal(items: CartItem[], taxRate: number): number {
  if (items.length === 0) throw new Error("Items cannot be empty")
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  return Math.round(subtotal * (1 + taxRate))
}
```

### README Template
```markdown
# Project Name

Brief description of what this project does.

## Installation

```bash
bun install package-name
```

## Usage

```typescript
import { doSomething } from "package-name"

const result = doSomething("input")
```

## API Reference

### `doSomething(input: string): Result`

Description of the function.

**Parameters:**
- `input` - Description

**Returns:** Description of return value

## License

MIT
```

### Changelog Format
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-01-15

### Added
- New feature X for doing Y
- Support for Z format

### Changed
- Improved performance of W by 50%

### Fixed
- Bug where V would crash on empty input

### Removed
- Deprecated feature U

## [1.1.0] - 2025-01-01
...
```

### API Documentation Generation
```bash
# TypeDoc
npx typedoc --out docs src/index.ts

# TSDoc for individual modules
npx tsdoc src/services/user.service.ts
```

## Best Practices
- Document every public API function with JSDoc
- Include at least one example per function
- Keep README under 500 lines; link to detailed docs
- Use imperative mood in descriptions ("Calculates" not "This function calculates")
- Update documentation alongside code changes
- Use `@deprecated` tags for deprecated APIs with migration guidance
