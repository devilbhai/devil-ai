---
name: figma-to-code
description: Convert Figma designs to code - component extraction, responsive design, design tokens.
---

# Figma to Code

## When to Apply
Use this skill for converting Figma designs to React/Vue/CSS code, extracting components, or implementing designs.

## Core Concepts
- Design to code workflow
- Component extraction
- Responsive design
- Design tokens
- Animation implementation
- Accessibility

## Best Practices
- Extract design tokens first
- Build component hierarchy
- Use consistent spacing
- Implement responsive breakpoints
- Add animations and transitions
- Test across devices

## Design Tokens
```css
:root {
  /* Colors */
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

## Component Extraction
```jsx
// Figma: Button Component
// Properties: variant (primary/secondary), size (sm/md/lg)

const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseStyles = 'font-semibold rounded transition-colors';
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark'
  };
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## Responsive Implementation
```css
/* Mobile First */
.card {
  padding: var(--spacing-md);
}

/* Tablet */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-xl);
  }
}
```

## Animation Implementation
```css
/* Figma: Button hover effect */
.button {
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```
