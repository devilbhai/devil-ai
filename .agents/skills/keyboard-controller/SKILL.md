---
name: keyboard-controller
description: Keyboard automation. Hotkey simulation, text input, key sequence automation.
---

# Keyboard Controller

## When to Apply
Use when automating keyboard input, simulating hotkeys, entering text, or performing key sequences in desktop applications.

## Core Concepts
- **Text input**: Type strings with proper timing
- **Hotkey simulation**: Ctrl+C, Alt+Tab, etc.
- **Key sequences**: Multi-step keyboard operations
- **Modifier handling**: Shift, Ctrl, Alt, Meta combinations
- **Special keys**: Enter, Tab, Escape, function keys
- **Input field handling**: Clear, select, replace text

## Implementation
```
1. Identify target input field or window
2. Clear existing content if needed
3. Type text with appropriate delays
4. Execute hotkey combinations
5. Verify input was received
6. Handle focus changes
7. Clean up keyboard state
```

## Best Practices
- Match natural typing speed (50-150ms between keys)
- Handle international keyboard layouts
- Implement key press/release pairs correctly
- Use appropriate modifiers for special characters
- Test with different applications and input fields
