# Headroom Optimization Skill

## What is This Skill

This skill teaches **token optimization techniques** inspired by Headroom Desktop. It helps you write prompts and process tool outputs in ways that reduce token usage by 40-60% while maintaining accuracy.

**Use this skill when:**
- Writing long prompts or processing large outputs
- Dealing with API cost concerns
- Need to optimize token usage
- Working with tool outputs (bash, file reads, search results)

## Core Principles

### 1. Prompt Compression

**Bad (verbose):**
```
I need you to analyze the codebase and find all the files that contain the string "TODO" and then list them out for me in a nice format with file paths and line numbers so I can review them later.
```

**Good (compressed):**
```
Find all TODO comments. List: file:line format.
```

**Savings:** ~60% tokens

### 2. Tool Output Filtering

When receiving tool outputs, extract only relevant parts:

**Bash output:**
```
# Instead of full output, ask for:
- Errors only
- Last N lines
- Specific pattern matches
```

**File reads:**
```
# Instead of full file, ask for:
- Specific function/class
- Lines X-Y
- Imports and exports only
```

### 3. Structured Responses

**Bad:**
```
The file has several issues including missing imports, unused variables, and the function is too long and should be broken into smaller functions.
```

**Good:**
```
Issues:
1. Missing: import X from 'y'
2. Unused: var1, var2
3. Too long: fn() (45 lines → split)
```

**Savings:** ~40% tokens

## Compression Patterns

### Pattern 1: Bullet Points Over Paragraphs

**Before:** "The function calculateTotal takes three parameters including price, quantity, and tax rate. It returns the final total after applying the tax. The function is located in utils/math.ts file."

**After:**
```
calculateTotal(price, qty, taxRate) → total
Location: utils/math.ts
```

### Pattern 2: Code Over Description

**Before:** "Create a function that takes a string and returns it in lowercase with all spaces replaced by hyphens."

**After:**
```typescript
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-')
```

### Pattern 3: Symbols Over Words

**Before:** "equals", "greater than", "less than", "not equal to"

**After:** `=`, `>`, `<`, `!=`

### Pattern 4: Abbreviations

| Full | Abbrev |
|------|--------|
| function | fn |
| return | ret |
| parameter | param |
| argument | arg |
| import | imp |
| export | exp |
| environment | env |
| temporary | tmp |
| configuration | config |
| directory | dir |
| string | str |
| number | num |
| boolean | bool |
| undefined | undef |
| null | nil |
| true/false | T/F |
| because | b/c |
| example | e.g. |
| that is | i.e. |

### Pattern 5: Tree Structure Over Nested Text

**Before:** "The src directory contains components, hooks, and utils. Components has Chat, Sidebar, and Settings. Hooks has useAuth and useApi. Utils has helpers and constants."

**After:**
```
src/
├── components/ (Chat, Sidebar, Settings)
├── hooks/ (useAuth, useApi)
└── utils/ (helpers, constants)
```

## Tool Output Optimization

### Bash Commands

**Instead of:**
```bash
find . -name "*.ts" -type f | head -20
```

**Use:**
```bash
find . -name "*.ts" -type f | wc -l  # Count first
find . -name "*.ts" -type f -exec grep -l "pattern" {} \;  # Then filter
```

### File Operations

**Instead of reading entire file:**
```bash
# Read specific lines
sed -n '100,150p' file.ts

# Or use grep with context
grep -A 5 -B 5 "functionName" file.ts
```

### Search Results

**Instead of:**
```bash
grep -r "pattern" .  # Returns everything
```

**Use:**
```bash
grep -r "pattern" . --include="*.ts" | wc -l  # Count first
grep -r "pattern" . --include="*.ts" | head -10  # Then sample
```

## Token-Saving Strategies

### 1. Lazy Loading

Load only what's needed:
- Don't read entire file if you need one function
- Don't list all files if you need specific one
- Don't explain entire codebase for one bug

### 2. Caching Responses

Reuse previous answers:
- Reference earlier explanations
- Build on existing context
- Avoid repeating information

### 3. Chunked Processing

Break large tasks:
- Process 10 files at a time, not 100
- Review changes in batches
- Test incrementally

### 4. Smart Refactoring

Reduce repetition:
- Extract common patterns
- Create utility functions
- Use templates

## Integration with Devil AI

### Auto-Optimization

When writing prompts:
1. Remove unnecessary words
2. Use bullet points
3. Specify exact output format
4. Reference existing context

### Tool Usage

When using tools:
1. Filter output before displaying
2. Show only relevant results
3. Use pagination for large outputs
4. Cache frequent queries

### Response Formatting

When responding:
1. Use code blocks over descriptions
2. Bullet points over paragraphs
3. Tables over lists
4. Symbols over words

## Cost Calculator

Approximate token savings:

| Action | Without | With | Savings |
|--------|---------|------|---------|
| Prompt (100 words) | ~130 tokens | ~50 tokens | 62% |
| Tool output (1KB) | ~250 tokens | ~100 tokens | 60% |
| Response (200 words) | ~260 tokens | ~150 tokens | 42% |
| **Total per interaction** | **~640 tokens** | **~300 tokens** | **53%** |

**Monthly savings (100 interactions/day):**
- Without: ~1.92M tokens
- With: ~900K tokens
- **Savings: ~1M tokens/month**

## Quick Reference

### Prompt Templates

**Code Review:**
```
Review [file]. Find: bugs, perf, style. Format: file:line.
```

**Debug:**
```
Error: [error message]
Context: [what you were doing]
Expected: [what should happen]
```

**Refactor:**
```
Refactor [function]. Goals: [readability/perf/testability]
Constraints: [keep API same/no new deps]
```

### Response Templates

**Bug Report:**
```
Bug: [description]
Location: file:line
Fix: [code change]
```

**Performance Issue:**
```
Issue: [what's slow]
Impact: [X times slower]
Fix: [optimization]
```

**Code Review:**
```
File: path/to/file.ts
Issues: [count]
Critical: [list]
Suggestion: [list]
```

## Measuring Success

Track these metrics:
1. **Tokens per interaction** - Target: <300
2. **Response time** - Target: <2s
3. **Accuracy** - Target: >95%
4. **Cost per task** - Target: <$0.01

## When NOT to Optimize

Skip optimization when:
- Accuracy is critical (medical, legal, financial)
- User explicitly asks for detailed explanation
- Debugging complex issues
- Learning/teaching scenarios

**Remember:** Optimization should never sacrifice correctness.
