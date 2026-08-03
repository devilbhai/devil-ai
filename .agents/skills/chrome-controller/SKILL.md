---
name: chrome-controller
description: Chrome browser automation. Extension management, profile handling, DevTools protocol.
---

# Chrome Controller

## When to Apply
Use when automating Chrome browser tasks, managing extensions, handling profiles, or using DevTools protocol for advanced browser control.

## Core Concepts
- **DevTools Protocol**: Direct browser control via CDP
- **Extension management**: Install, configure, and use extensions
- **Profile handling**: Manage multiple browser profiles
- **Network interception**: Monitor and modify network requests
- **DOM manipulation**: Direct page content modification
- **Performance profiling**: Analyze page performance

## Implementation
```
1. Launch or connect to Chrome instance
2. Configure profile and extensions
3. Navigate to target URL
4. Wait for page load and required elements
5. Interact with page elements
6. Capture screenshots or extract data
7. Clean up and close browser
```

## Best Practices
- Use headless mode for automation tasks
- Handle dynamic content with explicit waits
- Implement proper error handling for network issues
- Respect rate limits and website terms of service
- Clean up browser profiles after use
