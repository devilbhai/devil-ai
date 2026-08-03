---
name: desktop-automation
description: Desktop GUI automation. Window management, mouse/keyboard control, clipboard operations.
---

# Desktop Automation

## When to Apply
Use when automating desktop applications, managing windows, controlling mouse/keyboard, or performing GUI-based tasks that can't be done via CLI.

## Core Concepts
- **Window management**: Find, focus, resize windows
- **Mouse control**: Click, move, drag operations
- **Keyboard control**: Type, hotkeys, key sequences
- **Clipboard operations**: Copy/paste automation
- **Screen capture**: Screenshot and region capture
- **Application launching**: Start and manage applications

## Implementation
```
1. Identify target application window
2. Bring window to focus if needed
3. Locate target UI elements
4. Perform mouse/keyboard actions
5. Verify action results
6. Handle timing and delays
7. Clean up state if needed
```

## Best Practices
- Add appropriate delays between actions
- Handle application startup time
- Implement retry logic for flaky interactions
- Use explicit waits instead of fixed delays
- Clean up clipboard contents after use
