---
name: window-manager
description: Window management automation. Window positioning, resizing, focus control, multi-monitor.
---

# Window Manager

## When to Apply
Use when automating window layout, positioning windows, managing focus, or working across multiple monitors.

## Core Concepts
- **Window positioning**: Place windows at specific coordinates
- **Window resizing**: Set exact dimensions
- **Focus control**: Bring windows to foreground
- **Multi-monitor**: Handle multiple display setups
- **Window snapping**: Align windows to edges/grids
- **Workspace management**: Virtual desktop organization

## Implementation
```
1. Enumerate available windows
2. Find target window by title/class
3. Get window dimensions and position
4. Apply desired position/size
5. Set focus if needed
6. Handle multi-monitor placement
7. Verify window state
```

## Best Practices
- Account for window decorations and taskbars
- Handle DPI scaling differences
- Test across different screen resolutions
- Respect window manager shortcuts
- Clean up window positions after automation
