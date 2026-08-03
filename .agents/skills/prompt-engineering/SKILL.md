---
name: prompt-engineering
description: Prompt engineering for code generation, chain-of-thought patterns, few-shot examples, and AI interaction best practices for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Prompt Engineering Patterns

Prompt engineering for better AI interactions in the Devil AI codebase.

## When to Apply

- Writing prompts for code generation
- Improving AI responses
- Creating few-shot examples
- Structuring complex requests
- Optimizing AI workflows

---

## 1. Basic Prompt Structure

### Clear and Specific

```
❌ Bad: "Write code"
✅ Good: "Write a TypeScript function that validates an email address using Zod schema"

❌ Bad: "Fix this"
✅ Good: "Fix the TypeScript error in the getUser function where it's not handling the null case"

❌ Bad: "Make it better"
✅ Good: "Refactor the calculateDiscount function to use early returns and extract the tax calculation into a separate function"
```

### Include Context

```
❌ Bad: "Create a button"
✅ Good: "Create a React button component that:
- Uses Tailwind CSS for styling
- Has three variants: primary, secondary, destructive
- Supports disabled state
- Includes loading state with spinner
- Uses TypeScript for props"
```

---

## 2. Chain-of-Thought

### Step-by-Step Reasoning

```
Think through this step by step:

1. First, understand the current code structure
2. Identify the bug or improvement needed
3. Consider edge cases
4. Write the solution
5. Verify it works

Current code:
[code here]

Problem:
[description here]
```

### Multi-Step Analysis

```
Analyze this code in multiple steps:

Step 1: What does this code do?
Step 2: What are the potential issues?
Step 3: What improvements can be made?
Step 4: Implement the improvements

Code:
[code here]
```

---

## 3. Few-Shot Examples

### Pattern Matching

```
Convert these API responses to our format:

Example 1:
Input: { "user_name": "John", "user_email": "john@example.com" }
Output: { name: "John", email: "john@example.com" }

Example 2:
Input: { "user_name": "Jane", "user_email": "jane@example.com" }
Output: { name: "Jane", email: "jane@example.com" }

Now convert:
Input: { "user_name": "Bob", "user_email": "bob@example.com" }
```

### Code Generation Examples

```
Generate React components following this pattern:

Example 1:
Input: Button with primary variant
Output:
```tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: "primary"
}

export function Button({ children, variant = "primary" }: ButtonProps) {
  return <button className={`btn btn-${variant}`}>{children}</button>
}
```

Example 2:
Input: Button with secondary variant
Output:
```tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: "secondary"
}

export function Button({ children, variant = "secondary" }: ButtonProps) {
  return <button className={`btn btn-${variant}`}>{children}</button>
}
```

Now generate:
Input: Button with destructive variant
```

---

## 4. Role-Based Prompts

### Expert Roles

```
As a senior TypeScript developer with 10 years of experience:

Review this code for:
1. Type safety issues
2. Potential bugs
3. Performance problems
4. Best practices violations

Code:
[code here]
```

### Security Expert

```
As a security expert specializing in web applications:

Audit this code for:
1. OWASP Top 10 vulnerabilities
2. Input validation issues
3. Authentication/authorization flaws
4. Data exposure risks

Code:
[code here]
```

---

## 5. Structured Prompts

### Template Format

```
## Context
[Background information]

## Task
[What needs to be done]

## Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Example
[If applicable, show example]
```

### Code Review Template

```
## Code to Review
```[language]
[code here]
```

## Review Criteria
1. Correctness - Does it work as expected?
2. Performance - Any optimization opportunities?
3. Security - Any vulnerabilities?
4. Readability - Is it easy to understand?
5. Maintainability - Will it be easy to modify?

## Please Provide
1. Summary of issues found
2. Specific line-by-line feedback
3. Suggested improvements with code examples
```

---

## 6. Code Generation Prompts

### Function Generation

```
Create a TypeScript function with:

Function name: validateEmail
Parameters: email (string)
Returns: boolean
Requirements:
- Use regex for validation
- Handle edge cases (empty string, null)
- Include JSDoc comments
- Add unit tests
```

### Component Generation

```
Create a React component with:

Component name: UserCard
Props:
- user: { name: string, email: string, avatar: string }
- onSelect: (userId: string) => void
- variant: "compact" | "full"
Requirements:
- Use Tailwind CSS
- Include TypeScript types
- Add proper accessibility (ARIA labels)
- Include loading state
- Add hover effects
```

### API Generation

```
Create a REST API endpoint with:

Method: POST
Path: /api/users
Request body: { name: string, email: string, password: string }
Requirements:
- Validate input with Zod
- Hash password with bcrypt
- Return user without password
- Handle duplicate email error
- Add proper error responses
```

---

## 7. Refactoring Prompts

### Code Improvement

```
Refactor this code to:

1. Extract repeated logic into helper functions
2. Use TypeScript utility types where appropriate
3. Add proper error handling
4. Improve variable naming
5. Add JSDoc comments

Current code:
[code here]
```

### Performance Optimization

```
Optimize this code for performance:

1. Identify any O(n²) operations
2. Look for unnecessary re-renders
3. Find opportunities for memoization
4. Check for memory leaks
5. Suggest specific optimizations

Code:
[code here]
```

---

## 8. Testing Prompts

### Test Generation

```
Generate unit tests for this function:

Function:
```typescript
function calculateDiscount(price: number, isVip: boolean): number {
  if (isVip) return price * 0.8
  return price
}
```

Requirements:
- Test normal users
- Test VIP users
- Test edge cases (0, negative, large numbers)
- Use Bun test framework
- Include descriptive test names
```

### Test Case Generation

```
Generate test cases for this API endpoint:

Endpoint: POST /api/users
Request: { name: string, email: string }

Generate:
1. Happy path tests
2. Validation error tests
3. Duplicate email tests
4. Missing field tests
5. Edge case tests
```

---

## 9. Debugging Prompts

### Bug Analysis

```
Analyze this bug:

Error message: [error message]
Code causing error:
```[language]
[code here]
```

Expected behavior: [what should happen]
Actual behavior: [what is happening]

Please:
1. Identify the root cause
2. Explain why it's happening
3. Provide a fix
4. Suggest how to prevent it in the future
```

### Debugging Steps

```
Help me debug this issue step by step:

1. What are the possible causes?
2. How can I verify each cause?
3. What's the most likely cause?
4. What's the fix?
5. How can I test the fix?

Issue: [description]
Code:
```[language]
[code here]
```
```

---

## 10. Best Practices

1. **Be specific** — Clear instructions get better results
2. **Provide context** — Background helps AI understand
3. **Use examples** — Few-shot learning improves quality
4. **Structure requests** — Organized prompts are easier to follow
5. **Set constraints** — Define boundaries and requirements
6. **Iterate** — Refine prompts based on results
7. **Validate output** — Always check AI-generated code
8. **Combine techniques** — Use multiple patterns together
9. **Document prompts** — Save effective prompts for reuse
10. **Stay updated** — AI capabilities evolve constantly
