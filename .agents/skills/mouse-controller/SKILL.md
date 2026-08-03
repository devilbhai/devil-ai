---
name: mouse-controller
description: Mouse automation. Click patterns, drag-drop, scroll control, gesture simulation.
---

# Mouse Controller

## When to Apply
Use when automating mouse interactions, performing click patterns, drag-drop operations, or simulating gestures on desktop applications.

## Core Concepts
- **Click patterns**: Single, double, right, middle click
- **Drag and drop**: Move elements between locations
- **Scroll control**: Vertical and horizontal scrolling
- **Gesture simulation**: Multi-touch and gesture patterns
- **Coordinate systems**: Absolute and relative positioning
- **Click timing**: Dwell time and click intervals

## Implementation
```
1. Identify target screen coordinates
2. Move mouse to target location
3. Perform click or gesture pattern
4. Handle drag-drop if needed
5. Verify action completed
6. Add appropriate delays
7. Return mouse to neutral position if needed
```

## Best Practices
- Use screen coordinates relative to target window
- Add small random offsets to avoid detection
- Implement human-like timing patterns
- Handle screen resolution differences
- Clean up mouse state after automation
