---
name: motion-design
description: Motion design - video editing, transitions, effects, rendering, animation principles.
---

# Motion Design

## When to Apply
Use this skill for video editing, motion graphics, transitions, or animation.

## Core Concepts
- Animation principles
- Easing functions
- Transitions
- Keyframe animation
- Effects and filters
- Rendering optimization

## Best Practices
- Follow 12 principles of animation
- Use easing for natural motion
- Keep animations purposeful
- Maintain consistent timing
- Test at different speeds
- Optimize for target platform

## Easing Functions
```css
/* Linear */
transition: all 0.3s linear;

/* Ease */
transition: all 0.3s ease;

/* Ease In */
transition: all 0.3s ease-in;

/* Ease Out */
transition: all 0.3s ease-out;

/* Ease In Out */
transition: all 0.3s ease-in-out;

/* Cubic Bezier */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

## Video Transitions
```css
/* Fade */
.fade-enter {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fade-enter-active {
  opacity: 1;
}

/* Slide */
.slide-enter {
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.slide-enter-active {
  transform: translateX(0);
}

/* Scale */
.scale-enter {
  transform: scale(0.8);
  opacity: 0;
  transition: all 0.3s ease;
}

.scale-enter-active {
  transform: scale(1);
  opacity: 1;
}
```

## Keyframe Animation
```css
/* Complex animation */
@keyframes complexAnimation {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
  }
  50% {
    transform: translateY(-40px) rotate(0deg);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-20px) rotate(-5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
}

.complex-animation {
  animation: complexAnimation 2s ease-in-out infinite;
}
```

## Stagger Animations
```css
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: staggerIn 0.5s ease forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Performance Optimization
- Use transform and opacity only
- Avoid animating layout properties
- Use will-change for complex animations
- Batch DOM reads/writes
- Use requestAnimationFrame
- Consider reduced motion preferences
