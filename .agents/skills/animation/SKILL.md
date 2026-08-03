---
name: animation
description: CSS animations, transitions, Framer Motion patterns, and motion design for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Animation Patterns

Animation and motion design patterns for the Devil AI codebase.

## When to Apply

- Adding transitions
- Creating animations
- Implementing loading states
- Building interactive UI
- Enhancing user experience

---

## 1. CSS Transitions

### Basic Transitions

```css
/* ✅ Color transition */
.button {
  transition: background-color 200ms ease;
}

.button:hover {
  background-color: #2563eb;
}

/* ✅ Transform transition */
.card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ✅ Multiple properties */
.element {
  transition: 
    opacity 300ms ease,
    transform 300ms ease,
    color 200ms ease;
}
```

### Tailwind Transitions

```tsx
// ✅ Tailwind transition utilities
<button className="transition-colors duration-200 hover:bg-blue-700">

<div className="transition-transform duration-300 hover:scale-105">

<div className="transition-all duration-200 ease-in-out">

// ✅ Custom transition
<div className="transition-[height] duration-500 ease-in-out">
```

### Transition Timing Functions

```css
/* ✅ Different easing functions */
.ease-linear {
  transition-timing-function: linear;
}

.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ✅ Custom spring-like easing */
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 2. CSS Keyframe Animations

### Basic Animations

```css
/* ✅ Fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 300ms ease forwards;
}

/* ✅ Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 300ms ease forwards;
}

/* ✅ Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 200ms ease forwards;
}
```

### Loading Animations

```css
/* ✅ Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* ✅ Spin */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* ✅ Bounce */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}
```

### Stagger Animations

```css
/* ✅ Stagger children */
.stagger-children > * {
  opacity: 0;
  animation: slideUp 300ms ease forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
```

---

## 3. Tailwind Animations

### Custom Animations

```css
/* ✅ Define in globals.css */
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

@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

@layer utilities {
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
  
  .animate-slide-out {
    animation: slide-out 0.3s ease-in;
  }
}
```

### Usage

```tsx
// ✅ Animate on mount
<div className="animate-slide-in">

// ✅ Animate with delay
<div className="animate-slide-in" style={{ animationDelay: "0.1s" }}>

// ✅ Animate conditionally
<div className={isVisible ? "animate-slide-in" : "animate-slide-out"}>

// ✅ Hover animations
<div className="transition-transform duration-200 hover:scale-105 active:scale-95">
```

---

## 4. Framer Motion

### Installation

```bash
bun add framer-motion
```

### Basic Usage

```tsx
import { motion } from "framer-motion"

// ✅ Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>

// ✅ Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// ✅ Scale
<motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
>
  Content
</motion.div>
```

### Animations

```tsx
// ✅ Hover animation
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// ✅ Drag
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  onDragEnd={(event, info) => {
    console.log(info.point.x)
  }}
>
  Drag me
</motion.div>

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### Page Transitions

```tsx
import { AnimatePresence, motion } from "framer-motion"
import { useLocation } from "react-router-dom"

function PageTransition() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          {/* Routes */}
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## 5. Loading States

### Skeleton Loading

```tsx
// ✅ Skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  )
}

// ✅ Card skeleton
function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}
```

### Progress Indicators

```tsx
// ✅ Linear progress
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ✅ Circular progress
function CircularProgress({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
```

### Typing Indicator

```tsx
// ✅ Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  )
}
```

---

## 6. Interactive Animations

### Toggle Animation

```tsx
// ✅ Toggle with animation
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  )
}
```

### Accordion Animation

```tsx
// ✅ Accordion with height animation
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex justify-between items-center"
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-3">{children}</div>
      </div>
    </div>
  )
}
```

### Modal Animation

```tsx
// ✅ Modal with animation
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## 7. Performance

### GPU Acceleration

```css
/* ✅ Use transform for animations */
.animated {
  /* Use transform instead of top/left/margin */
  transform: translateX(100px);
  
  /* Use will-change for complex animations */
  will-change: transform, opacity;
}

/* ✅ Avoid animating layout properties */
/* ❌ Don't animate these */
.bad {
  transition: width 300ms, height 300ms, margin 300ms;
}

/* ✅ Animate these instead */
.good {
  transition: transform 300ms, opacity 300ms;
}
```

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
    scroll-behavior: auto !important;
  }
}
```

```tsx
// ✅ Check for reduced motion
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
```

---

## 8. Best Practices

1. **Use transform and opacity** — GPU accelerated properties
2. **Avoid layout thrashing** — Don't animate width/height/margin
3. **Respect reduced motion** — Check `prefers-reduced-motion`
4. **Keep animations short** — 200-300ms is usually enough
5. **Use easing functions** — `ease-out` for entrances, `ease-in` for exits
6. **Stagger animations** — For lists and groups
7. **Test on slow devices** — Animations should be smooth everywhere
8. **Clean up animations** — Remove event listeners and timers
9. **Use Framer Motion for complex animations** — React integration is excellent
10. **Document animation patterns** — Keep a style guide
