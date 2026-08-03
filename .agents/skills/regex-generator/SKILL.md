---
name: regex-generator
description: Regular expression generation. Pattern creation, testing, optimization, explanation.
---

# Regex Generator

## When to Apply
Use this skill when creating regular expressions: building patterns for validation, extraction, or replacement; testing regex; or optimizing existing patterns.

## Core Concepts
- Anchors: `^` (start), `$` (end) for position matching
- Quantifiers: `*` (0+), `+` (1+), `?` (0 or 1), `{n,m}` (range)
- Character classes: `\d` (digit), `\w` (word), `\s` (whitespace)
- Groups: `()` for capture, `(?:)` for non-capture
- Alternation: `|` for OR logic
- Lookahead/lookbehind: `(?=...)`, `(?<=...)` for contextual matching

## Implementation

### Common Patterns
```typescript
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  semver: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/,
  ipAddress: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  phone: /^\+?[\d\s()-]{10,}$/,
}
```

### Validation Functions
```typescript
function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

function extractMentions(text: string): string[] {
  return [...text.matchAll(/@(\w+)/g)].map((match) => match[1])
}

function extractHashtags(text: string): string[] {
  return [...text.matchAll(/#(\w+)/g)].map((match) => match[1])
}
```

### Pattern Testing
```typescript
// Test a regex against multiple inputs
function testPattern(pattern: RegExp, inputs: string[]): void {
  for (const input of inputs) {
    const match = pattern.test(input)
    console.log(`${match ? "✓" : "✗"} "${input}"`)
  }
}

testPattern(/^\d{4}-\d{2}-\d{2}$/, [
  "2025-01-15",  // ✓
  "2025-1-15",   // ✗
  "2025/01/15",  // ✗
])
```

### Optimization Tips
```typescript
// BAD: Catastrophic backtracking
/^(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaa!")

// GOOD: Atomic grouping / possessive quantifiers
// Use specific quantifiers instead of nested groups

// BAD: Unnecessary capture groups
/(https?):\/\/(.+)\/(.+)/.exec(url)

// GOOD: Non-capturing groups when not extracting
/(?:https?):\/\/(?:.+)\/(?:.+)/.exec(url)
```

### Test Tool (regex101-style)
```typescript
function describePattern(pattern: RegExp): string {
  const flags = pattern.flags
  const source = pattern.source
  let desc = `Pattern: ${source}\n`
  desc += `Flags: ${flags || "none"}\n`
  if (source.includes("^")) desc += "- Anchored to start\n"
  if (source.includes("$")) desc += "- Anchored to end\n"
  if (source.includes("(?=")) desc += "- Contains lookahead\n"
  return desc
}
```

## Best Practices
- Test regex with both valid and invalid inputs
- Use online tools (regex101.com) for visualization and debugging
- Prefer non-capturing groups `(?:)` when capture isn't needed
- Avoid catastrophic backtracking: no nested quantifiers `(a+)+`
- Use `^` and `$` anchors for full-string validation
- Document complex patterns with comments in code
