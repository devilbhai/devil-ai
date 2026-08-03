---
name: document-comparator
description: Compare documents, highlight changes, detect differences, and merge content.
---

# Document Comparator

## When to Apply
Use this skill when comparing versions, reviewing changes, detecting plagiarism, or merging document modifications.

## Core Concepts
- Line-by-line diff
- Semantic comparison
- Change classification
- Merge conflict resolution
- Version history tracking

## Implementation

### Diff Algorithm
```typescript
interface DiffResult {
  additions: DiffLine[]
  deletions: DiffLine[]
  modifications: { old: DiffLine; new: DiffLine }[]
  unchanged: number
}

interface DiffLine {
  lineNumber: number
  content: string
  type: "added" | "removed" | "modified" | "unchanged"
}

function computeDiff(oldDoc: string, newDoc: string): DiffResult {
  const oldLines = oldDoc.split("\n")
  const newLines = newDoc.split("\n")
  
  // LCS (Longest Common Subsequence) algorithm
  // Classify each line as added, removed, modified, or unchanged
  // Return structured diff
}
```

### Change Classification
```typescript
type ChangeType = 
  | "content"      // Text changed
  | "formatting"   // Whitespace/formatting only
  | "structure"    // Headings, sections rearranged
  | "metadata"     // Title, author, dates
  | "reference"    // Citations, links changed

function classifyChange(oldLine: string, newLine: string): ChangeType {
  // Compare content ignoring whitespace
  // Check if only formatting changed
  // Detect structural changes
}
```

### Merge Changes
```typescript
interface MergeResult {
  content: string
  conflicts: Conflict[]
}

interface Conflict {
  line: number
  ours: string
  theirs: string
  resolution?: string
}
```

## Visualization
- Side-by-side view
- Inline with highlights
- Unified diff format
- Semantic markup (bold for changes)

## Best Practices
- Normalize whitespace before comparison
- Ignore comments in code diffs
- Provide context around changes
- Allow selective merge of changes
- Export diff as report
