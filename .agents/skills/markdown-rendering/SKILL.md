---
name: markdown-rendering
description: Markdown rendering in React, syntax highlighting, code blocks, safe HTML rendering, and MDX patterns for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Markdown Rendering Patterns

Markdown rendering patterns for the Devil AI codebase.

## When to Apply

- Rendering markdown content
- Displaying code blocks
- Creating rich text editors
- Handling user-generated content
- Building documentation viewers

---

## 1. Basic Rendering

### React Markdown

```tsx
// ✅ components/markdown/markdown-renderer.tsx
import ReactMarkdown from "react-markdown"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
```

### Custom Components

```tsx
// ✅ Custom markdown components
import ReactMarkdown from "react-markdown"

const components = {
  // ✅ Headings
  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
  
  // ✅ Paragraphs
  p: ({ children }) => <p className="mb-4 text-gray-700 dark:text-gray-300">{children}</p>,
  
  // ✅ Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 underline"
    >
      {children}
    </a>
  ),
  
  // ✅ Lists
  ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  
  // ✅ Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
      {children}
    </blockquote>
  ),
  
  // ✅ Inline code
  code: ({ className, children, ...props }) => {
    const isInline = !className
    
    if (isInline) {
      return (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      )
    }
    
    return <code className={className} {...props}>{children}</code>
  },
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
```

---

## 2. Code Blocks

### Syntax Highlighting

```tsx
// ✅ components/markdown/code-block.tsx
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useState } from "react"

interface CodeBlockProps {
  language: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <span className="text-sm text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="text-sm text-gray-400 hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
```

### Code Block in Markdown

```tsx
// ✅ Custom code component for ReactMarkdown
const components = {
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "")
    const code = String(children).replace(/\n$/, "")
    
    if (match) {
      return <CodeBlock language={match[1]} code={code} />
    }
    
    return (
      <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    )
  },
}
```

---

## 3. GFM (GitHub Flavored Markdown)

### Tables

```tsx
// ✅ Table component
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-300 dark:border-gray-600">
        {children}
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-left font-semibold">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">
      {children}
    </td>
  )
}
```

### Task Lists

```tsx
// ✅ Task list component
function TaskListItem({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="h-4 w-4 rounded border-gray-300"
      />
      <span className={checked ? "line-through text-gray-500" : ""}>{children}</span>
    </li>
  )
}
```

---

## 4. Safe HTML Rendering

### Sanitize HTML

```tsx
// ✅ Safe HTML rendering
import DOMPurify from "dompurify"

interface SafeHtmlProps {
  html: string
  className?: string
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "code", "pre", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  })
  
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
```

### HTML Whitelist

```typescript
// ✅ Configure DOMPurify
import DOMPurify from "dompurify"

const config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "strong", "em", "b", "i", "u", "s",
    "a", "code", "pre", "blockquote",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "figure", "figcaption",
    "div", "span",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel",
    "src", "alt", "width", "height",
    "className", "style",
  ],
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, config)
}
```

---

## 5. Markdown Editor

### Basic Editor

```tsx
// ✅ components/markdown/markdown-editor.tsx
import { useState } from "react"
import ReactMarkdown from "react-markdown"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
        <button
          onClick={() => setIsPreview(false)}
          className={`px-3 py-1 rounded ${!isPreview ? "bg-white dark:bg-gray-700" : ""}`}
        >
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-3 py-1 rounded ${isPreview ? "bg-white dark:bg-gray-700" : ""}`}
        >
          Preview
        </button>
      </div>
      
      {isPreview ? (
        <div className="p-4 min-h-[200px]">
          <MarkdownRenderer content={value || "*Nothing to preview*"} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-4 resize-none focus:outline-none"
        />
      )}
    </div>
  )
}
```

---

## 6. Performance

### Memoization

```tsx
// ✅ Memoize markdown rendering
import { memo, useMemo } from "react"

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: {
  content: string
}) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
})
```

### Lazy Loading

```tsx
// ✅ Lazy load markdown renderer
const MarkdownRenderer = lazy(() =>
  import("./markdown-renderer").then((mod) => ({
    default: mod.MarkdownRenderer,
  }))
)

function ChatMessage({ content }: { content: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarkdownRenderer content={content} />
    </Suspense>
  )
}
```

---

## 7. Best Practices

1. **Sanitize user content** — Always use DOMPurify for HTML
2. **Memoize components** — Prevent unnecessary re-renders
3. **Custom components** — Match your design system
4. **Syntax highlighting** — Use Prism or highlight.js
5. **Handle code blocks** — Copy button, language label
6. **Responsive tables** — Overflow on mobile
7. **Dark mode** — Use prose-invert class
8. **Accessibility** — Proper heading hierarchy
9. **Error handling** — Graceful fallback for invalid markdown
10. **Performance** — Lazy load heavy dependencies
