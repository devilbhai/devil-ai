---
name: css-tailwind
description: Tailwind CSS v4 patterns, responsive design, dark mode, custom utilities, and styling conventions for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# CSS Tailwind Patterns

Comprehensive Tailwind CSS patterns for the Devil AI codebase (Tailwind v4).

## When to Apply

- Writing new component styles
- Creating responsive layouts
- Implementing dark mode
- Building custom utilities
- Refactoring CSS-in-JS to Tailwind

---

## 1. Responsive Design

### Mobile-First Approach

```tsx
// ✅ Always start with mobile, add breakpoints for larger screens
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width on mobile, half on tablet, third on desktop */}
</div>
```

### Container Queries (Tailwind v4)

```tsx
// ✅ Use container queries for component-level responsiveness
<div className="@container">
  <div className="flex flex-col @md:flex-row">
    {/* Stack on small containers, row on larger */}
  </div>
</div>
```

### Common Breakpoint Patterns

```tsx
// ✅ Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

// ✅ Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// ✅ Responsive text
<h1 className="text-lg md:text-xl lg:text-2xl">

// ✅ Responsive visibility
<div className="hidden md:block">
<div className="block md:hidden">
```

---

## 2. Dark Mode

### Class Strategy

```tsx
// ✅ Use class strategy for user-controlled dark mode
// In tailwind.config.js:
// darkMode: 'class'

// Usage
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ Dark mode with opacity
<div className="bg-white/90 dark:bg-gray-900/90">

// ✅ Dark mode specific borders
<div className="border border-gray-200 dark:border-gray-700">
```

### Dark Mode Patterns

```tsx
// ✅ Card component with dark mode
<div className="
  bg-white 
  dark:bg-gray-800 
  border border-gray-200 
  dark:border-gray-700 
  shadow-sm 
  dark:shadow-gray-900/50
">

// ✅ Input with dark mode
<input className="
  bg-white 
  dark:bg-gray-800 
  border border-gray-300 
  dark:border-gray-600 
  text-black 
  dark:text-white 
  placeholder-gray-500 
  dark:placeholder-gray-400
" />

// ✅ Button with dark mode
<button className="
  bg-blue-600 
  hover:bg-blue-700 
  dark:bg-blue-500 
  dark:hover:bg-blue-600 
  text-white
">
```

---

## 3. Custom Utilities

### Tailwind v4 CSS Utilities

```css
/* ✅ Define custom utilities in globals.css */
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-none {
    scrollbar-width: none;
  }
  
  .focus-ring {
    @apply outline-none ring-2 ring-blue-500 ring-offset-2;
  }
}

/* ✅ Custom component classes */
@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg 
           hover:bg-blue-700 transition-colors;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm 
           border border-gray-200 dark:border-gray-700 p-4;
  }
}
```

### Utility Patterns

```tsx
// ✅ Scrollbar utilities
<div className="overflow-y-auto scrollbar-thin">
<div className="overflow-y-auto scrollbar-none">

// ✅ Focus ring utility
<input className="focus-ring" />
<button className="focus-ring">

// ✅ Truncate text
<p className="truncate max-w-xs">
<p className="line-clamp-2">

// ✅ Smooth scrolling
<div className="scroll-smooth">
```

---

## 4. Animation & Transitions

### Tailwind Transitions

```tsx
// ✅ Color transition
<button className="transition-colors duration-200">

// ✅ Transform transition
<div className="transition-transform duration-300 hover:scale-105">

// ✅ All properties
<div className="transition-all duration-200">

// ✅ Custom easing
<div className="transition ease-in-out duration-500">
```

### Keyframe Animations

```css
/* ✅ Define custom animations */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@layer utilities {
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
}
```

### Usage

```tsx
// ✅ Animate on mount
<div className="animate-slide-in">

// ✅ Slow pulse for loading
<div className="animate-pulse-slow">

// ✅ Hover animations
<div className="transition-transform duration-200 hover:scale-105 hover:shadow-lg">

// ✅ Stagger animations
<div className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
<div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
```

---

## 5. Layout Patterns

### Flexbox

```tsx
// ✅ Center content
<div className="flex items-center justify-center">

// ✅ Space between
<div className="flex items-center justify-between">

// ✅ Wrap with gap
<div className="flex flex-wrap gap-4">

// ✅ Stack (vertical flex)
<div className="flex flex-col gap-2">

// ✅ Sticky header
<header className="sticky top-0 z-50">
```

### Grid

```tsx
// ✅ Auto-fit grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

// ✅ Fixed columns
<div className="grid grid-cols-4 gap-4">

// ✅ Auto-fill
<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">

// ✅ Named areas
<div className="grid grid-cols-[200px_1fr_200px] gap-4">
```

### Common Layouts

```tsx
// ✅ Sidebar layout
<div className="flex h-screen">
  <aside className="w-64 border-r">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 overflow-auto">
    {/* Main content */}
  </main>
</div>

// ✅ Holy grail layout
<div className="flex flex-col min-h-screen">
  <header className="h-16 border-b">
    {/* Header */}
  </header>
  <div className="flex flex-1">
    <aside className="w-64 border-r">
      {/* Sidebar */}
    </aside>
    <main className="flex-1">
      {/* Content */}
    </main>
    <aside className="w-64 border-l">
      {/* Right sidebar */}
    </aside>
  </div>
  <footer className="h-16 border-t">
    {/* Footer */}
  </footer>
</div>
```

---

## 6. Typography

### Text Styles

```tsx
// ✅ Heading hierarchy
<h1 className="text-3xl font-bold tracking-tight">
<h2 className="text-2xl font-semibold">
<h3 className="text-xl font-medium">
<p className="text-base text-gray-600 dark:text-gray-400">

// ✅ Prose for rich text
<div className="prose dark:prose-invert max-w-none">

// ✅ Code blocks
<code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
```

### Font Loading

```css
/* ✅ Define font families */
@layer base {
  :root {
    --font-sans: "Inter", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", monospace;
  }
}
```

```tsx
// ✅ Use custom fonts
<div className="font-sans">
<div className="font-mono">
```

---

## 7. Spacing & Sizing

### Consistent Spacing

```tsx
// ✅ Section spacing
<section className="py-12 md:py-16">

// ✅ Card padding
<div className="p-4 md:p-6">

// ✅ Stack spacing
<div className="space-y-4">
<div className="space-y-6">
<div className="space-x-4">

// ✅ Gap in flex/grid
<div className="flex gap-2 md:gap-4">
<div className="grid gap-4">
```

### Width/Height Patterns

```tsx
// ✅ Full screen
<div className="w-full h-screen">

// ✅ Min/max constraints
<div className="w-full max-w-7xl mx-auto">

// ✅ Aspect ratios
<div className="aspect-video">
<div className="aspect-square">

// ✅ Container queries
<div className="w-full @sm:w-auto">
```

---

## 8. State Variants

### Interactive States

```tsx
// ✅ Hover states
<button className="hover:bg-blue-700">

// ✅ Focus states
<input className="focus:outline-none focus:ring-2 focus:ring-blue-500">

// ✅ Active states
<button className="active:scale-95">

// ✅ Disabled states
<button className="disabled:opacity-50 disabled:cursor-not-allowed">

// ✅ Group hover
<div className="group">
  <div className="group-hover:text-blue-600">
```

### Conditional Styling

```tsx
// ✅ Dynamic classes with clsx
import clsx from "clsx"

<div className={clsx(
  "base-styles",
  isActive && "active-styles",
  isDisabled && "disabled-styles",
  variant === "primary" && "primary-styles"
)}>

// ✅ Template literals
<div className={`${isActive ? "bg-blue-600" : "bg-gray-200"} text-white`}>
```

---

## 9. Performance Tips

### Optimization

```tsx
// ✅ Avoid dynamic class construction
// ❌ Bad - creates new class string on every render
<div className={`p-${size}`}>

// ✅ Good - use complete class strings
<div className={size === "sm" ? "p-2" : size === "md" ? "p-4" : "p-6"}>

// ✅ Or use a mapping
const sizeClasses = {
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
} as const

<div className={sizeClasses[size]}>
```

### CSS-in-JS Migration

```tsx
// ✅ Before (CSS-in-JS)
const styles = {
  container: {
    padding: "16px",
    backgroundColor: theme.colors.background,
  },
}

// ✅ After (Tailwind)
<div className="p-4 bg-background">
```

---

## 10. Common Patterns

### Scrollable Areas

```tsx
// ✅ Custom scrollbar
<div className="overflow-y-auto scrollbar-thin scrollbar-track-transparent">

// ✅ Horizontal scroll
<div className="overflow-x-auto">
  <div className="flex gap-4 min-w-max">
    {/* Items */}
  </div>
</div>
```

### Overlay/Modal

```tsx
// ✅ Modal backdrop
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 m-4 max-w-lg w-full">
      {/* Modal content */}
    </div>
  </div>
</div>
```

### Tooltips

```tsx
// ✅ Simple tooltip with group
<div className="relative group">
  <button>Hover me</button>
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
    Tooltip text
  </div>
</div>
```

---

## Best Practices

1. **Mobile-first** — Always start with mobile styles, add breakpoints for larger screens
2. **Use semantic color names** — `text-foreground`, `bg-background` instead of `text-gray-900`
3. **Extract repeated patterns** — Create `@layer components` for reusable patterns
4. **Avoid dynamic classes** — Use complete class strings or mappings
5. **Use `clsx` for conditionals** — Clean conditional class composition
6. **Dark mode always** — Always include `dark:` variants for user-facing components
7. **Consistent spacing** — Use the spacing scale (p-4, p-6, p-8) consistently
8. **Accessibility first** — Always include focus states and proper contrast
