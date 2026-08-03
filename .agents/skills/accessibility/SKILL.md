---
name: accessibility
description: Accessibility patterns, ARIA roles, keyboard navigation, focus management, and screen reader support for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Accessibility Patterns

Accessibility patterns for the Devil AI codebase.

## When to Apply

- Building new components
- Implementing interactive elements
- Creating navigation systems
- Handling focus management
- Writing semantic HTML

---

## 1. Semantic HTML

### Landmarks

```tsx
// ✅ Use semantic landmarks
<header role="banner">
  <nav aria-label="Main navigation">
    {/* Navigation */}
  </nav>
</header>

<main role="main">
  {/* Main content */}
</main>

<aside role="complementary">
  {/* Sidebar */}
</aside>

<footer role="contentinfo">
  {/* Footer */}
</footer>
```

### Headings

```tsx
// ✅ Proper heading hierarchy
<h1>Page Title</h1>

<section>
  <h2>Section Title</h2>
  
  <article>
    <h3>Article Title</h3>
  </article>
</section>

// ❌ Never skip heading levels
<h1>Title</h1>
<h3>Skipped h2!</h3>
```

### Lists

```tsx
// ✅ Use proper list elements
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<ol>
  <li>First step</li>
  <li>Second step</li>
</ol>

<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

---

## 2. ARIA Roles & Attributes

### Interactive Elements

```tsx
// ✅ Button with ARIA
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</button>

// ✅ Link with descriptive text
<a href="/profile" aria-label="View user profile">
  Profile
</a>

// ✅ Icon button with tooltip
<button
  aria-label="Settings"
  aria-describedby="settings-tooltip"
>
  <SettingsIcon aria-hidden="true" />
</button>
<div id="settings-tooltip" role="tooltip">
  Settings
</div>
```

### Live Regions

```tsx
// ✅ Announce dynamic changes
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {isLoading ? "Loading..." : `${count} results found`}
</div>

// ✅ Assertive announcements
<div
  role="alert"
  aria-live="assertive"
>
  {error && <p>{error}</p>}
</div>

// ✅ Timer updates
<div
  role="timer"
  aria-live="off"
  aria-label="Time remaining"
>
  {timeRemaining}
</div>
```

### Custom Components

```tsx
// ✅ Tab list
<div role="tablist" aria-label="Settings tabs">
  <button
    role="tab"
    aria-selected={activeTab === "general"}
    aria-controls="general-panel"
    id="general-tab"
  >
    General
  </button>
  <button
    role="tab"
    aria-selected={activeTab === "security"}
    aria-controls="security-panel"
    id="security-tab"
  >
    Security
  </button>
</div>

<div
  role="tabpanel"
  id="general-panel"
  aria-labelledby="general-tab"
  hidden={activeTab !== "general"}
>
  {/* General settings */}
</div>

// ✅ Dialog
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure you want to proceed?</p>
  <button onClick={onConfirm}>Yes</button>
  <button onClick={onCancel}>No</button>
</div>

// ✅ Menu
<div role="menu" aria-label="Actions">
  <button role="menuitem" tabIndex={-1}>
    Edit
  </button>
  <button role="menuitem" tabIndex={-1}>
    Delete
  </button>
</div>
```

---

## 3. Keyboard Navigation

### Focus Management

```tsx
// ✅ Focus trap in modal
function Modal({ isOpen, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus()
    }
  }, [isOpen])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
    
    // Trap focus
    if (e.key === "Tab") {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (!focusableElements?.length) return
      
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}
```

### Roving Tab Index

```tsx
// ✅ Arrow key navigation in menu
function Menu({ items }: MenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % items.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
        break
      case "Home":
        e.preventDefault()
        setActiveIndex(0)
        break
      case "End":
        e.preventDefault()
        setActiveIndex(items.length - 1)
        break
    }
  }
  
  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          role="menuitem"
          tabIndex={index === activeIndex ? 0 : -1}
          aria-current={index === activeIndex ? "true" : undefined}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

### Skip Links

```tsx
// ✅ Skip navigation link
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:border focus:border-gray-300"
    >
      Skip to main content
    </a>
  )
}

// Usage
function Layout() {
  return (
    <>
      <SkipLink />
      <header>
        <nav>{/* Navigation */}</nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {/* Main content */}
      </main>
    </>
  )
}
```

---

## 4. Focus Styles

### Visible Focus Indicators

```css
/* ✅ Focus styles */
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ✅ Custom focus ring */
.focus-ring {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* ✅ Dark mode focus */
.dark .focus-ring {
  @apply ring-blue-400 ring-offset-gray-900;
}
```

### Component Focus Patterns

```tsx
// ✅ Button with focus styles
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

// ✅ Input with focus styles
<input className="focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />

// ✅ Card with focus styles (for clickable cards)
<div
  tabIndex={0}
  role="button"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
>
  Clickable card content
</div>
```

---

## 5. Color & Contrast

### Color Contrast Requirements

```css
/* ✅ WCAG AA contrast ratios */
/* Normal text: 4.5:1 */
/* Large text (18px+): 3:1 */
/* UI components: 3:1 */

/* ✅ Use CSS variables for theming */
:root {
  --color-text-primary: #111827;      /* Gray 900 */
  --color-text-secondary: #6b7280;    /* Gray 500 */
  --color-text-disabled: #9ca3af;     /* Gray 400 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;      /* Gray 50 */
  --color-border: #e5e7eb;            /* Gray 200 */
}

.dark {
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-text-disabled: #6b7280;
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;      /* Gray 800 */
  --color-border: #374151;            /* Gray 700 */
}
```

### Not Relying on Color Alone

```tsx
// ❌ Don't rely only on color
<div className="text-red-500">Error</div>

// ✅ Use color + icon + text
<div className="text-red-500 flex items-center gap-2">
  <ExclamationCircleIcon aria-hidden="true" />
  <span>Error: Invalid email address</span>
</div>

// ✅ Use patterns/shapes for charts
<div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-500" />
    <span>Sales</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-500 pattern-diagonal" />
    <span>Revenue</span>
  </div>
</div>
```

---

## 6. Forms

### Form Labels

```tsx
// ✅ Associated labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Visual label with aria-label
<input aria-label="Email address" type="email" />

// ✅ Placeholder is not a label
<input placeholder="Email" aria-label="Email" />

// ✅ Required fields
<label htmlFor="name">
  Name <span aria-hidden="true">*</span>
</label>
<input id="name" required aria-required="true" />

// ✅ Error messages
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" role="alert">
    Please enter a valid email
  </p>
)}
```

### Fieldsets

```tsx
// ✅ Group related fields
<fieldset>
  <legend>Shipping Address</legend>
  <input aria-label="Street address" />
  <input aria-label="City" />
  <input aria-label="ZIP code" />
</fieldset>

// ✅ Radio group
<fieldset>
  <legend>Choose a size</legend>
  <div role="radiogroup" aria-labelledby="size-label">
    <input type="radio" name="size" id="small" value="small" />
    <label htmlFor="small">Small</label>
    
    <input type="radio" name="size" id="medium" value="medium" />
    <label htmlFor="medium">Medium</label>
    
    <input type="radio" name="size" id="large" value="large" />
    <label htmlFor="large">Large</label>
  </div>
</fieldset>
```

---

## 7. Images & Media

### Images

```tsx
// ✅ Informative image
<img src="chart.png" alt="Sales chart showing 20% growth in Q4" />

// ✅ Decorative image
<img src="decorative.svg" alt="" aria-hidden="true" />

// ✅ Complex image with description
<figure>
  <img src="diagram.png" alt="System architecture diagram" aria-describedby="diagram-desc" />
  <figcaption id="diagram-desc">
    The system consists of three main components: frontend, API, and database.
  </figcaption>
</figure>
```

### SVG Icons

```tsx
// ✅ Decorative icon
<Icon aria-hidden="true" />

// ✅ Meaningful icon
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Icon with visible text
<button>
  <TrashIcon aria-hidden="true" />
  <span>Delete</span>
</button>
```

---

## 8. Motion & Animation

### Reduced Motion

```css
/* ✅ Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// ✅ Check for reduced motion preference
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])
  
  return prefersReducedMotion
}

// Usage
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div
      className={`transition-all ${
        prefersReducedMotion ? "" : "duration-300"
      }`}
    >
      Content
    </div>
  )
}
```

### Animations

```tsx
// ✅ Announce loading states
<div role="progressbar" aria-label="Loading" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
  <div style={{ width: `${progress}%` }} />
</div>

// ✅ Pause animations on hover/focus
<div
  className="group"
  onMouseEnter={(e) => e.currentTarget.classList.add("pause")}
  onMouseLeave={(e) => e.currentTarget.classList.remove("pause")}
>
  <div className="animate-pulse group-hover:paused group-focus-within:paused">
    Content
  </div>
</div>
```

---

## 9. Tables

### Accessible Tables

```tsx
// ✅ Proper table structure
<table>
  <caption>User List</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">John Doe</th>
      <td>john@example.com</td>
      <td>Admin</td>
    </tr>
  </tbody>
</table>

// ✅ Sortable headers
<th scope="col">
  <button
    aria-sort={sortColumn === "name" ? sortDirection : "none"}
    onClick={() => handleSort("name")}
  >
    Name
    {sortColumn === "name" && (
      <span aria-hidden="true">
        {sortDirection === "ascending" ? " ↑" : " ↓"}
      </span>
    )}
  </button>
</th>
```

---

## 10. Testing Accessibility

### Automated Testing

```typescript
import { describe, it, expect } from "bun:test"
import { render } from "@testing-library/react"
import { axe, toHaveNoViolations } from "jest-axe"

expect.extend(toHaveNoViolations)

describe("Accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<MyComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Manual Testing Checklist

- [ ] **Keyboard only** — Can navigate and interact without mouse
- [ ] **Screen reader** — All content announced correctly
- [ ] **Zoom** — UI usable at 200% zoom
- [ ] **Color contrast** — Text readable against background
- [ ] **Focus visible** — Focus indicator visible on all interactive elements
- [ ] **Error messages** — Clear and announced to screen readers
- [ ] **Skip links** — Can skip repetitive content
- [ ] **Time limits** — Can extend or disable time limits
- [ ] **Motion** — Animations can be paused/stopped
- [ ] **Touch targets** — Minimum 44x44px for touch devices

---

## Best Practices

1. **Semantic HTML first** — Use native elements before ARIA
2. **Keyboard accessible** — All interactive elements keyboard reachable
3. **Focus management** — Logical focus order, visible indicators
4. **Color contrast** — WCAG AA minimum (4.5:1 for text)
5. **Screen reader support** — Test with VoiceOver/NVDA
6. **Reduced motion** — Respect `prefers-reduced-motion`
7. **Error handling** — Clear, announced error messages
8. **Testing** — Automated (axe) + manual testing
9. **Documentation** — Document accessibility requirements
10. **Continuous improvement** — Regular accessibility audits
