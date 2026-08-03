---
name: animation-advanced
description: Advanced CSS animations - keyframes, transitions, scroll animations, micro-interactions.
---

# Advanced Animation

## When to Apply
Use this skill for complex CSS animations, scroll-based animations, or micro-interactions.

## Core Concepts
- Keyframe animations
- Scroll-triggered animations
- Parallax effects
- Loading animations
- Page transitions
- Performance optimization

## Best Practices
- Use transform and opacity for performance
- Respect prefers-reduced-motion
- Use will-change sparingly
- Keep animations subtle
- Test on mobile devices
- Use requestAnimationFrame for JS animations

## Keyframe Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Bounce */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-20px);
  }
  70% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}

.animate-bounce {
  animation: bounce 1s ease;
}
```

## Scroll Animations
```css
/* Intersection Observer based */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
// JavaScript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

## Micro-interactions
```css
/* Button hover */
.button {
  position: relative;
  overflow: hidden;
}

.button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.button:hover::after {
  width: 200%;
  height: 200%;
}

/* Input focus */
.input {
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}
```

## Loading Animations
```css
/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Pulse */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

## Performance Tips
- Use transform: translate3d() for GPU acceleration
- Animate opacity and transform only
- Use will-change for known animations
- Avoid animating layout properties
- Use requestAnimationFrame for JS
- Respect prefers-reduced-motion
