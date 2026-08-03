---
name: firefox-controller
description: Firefox browser automation. GeckoDriver, extension compatibility, profile management.
---

# Firefox Controller

## When to Apply
Use when automating Firefox browser tasks, managing GeckoDriver, handling Firefox-specific extensions, or when Chrome is not suitable for the task.

## Core Concepts
- **GeckoDriver**: WebDriver implementation for Firefox
- **Extension compatibility**: Firefox-specific extension management
- **Profile management**: Firefox profile configuration
- **Marionette protocol**: Firefox remote debugging protocol
- **Container tabs**: Isolated browsing contexts
- **Enhanced tracking protection**: Privacy-aware automation

## Implementation
```
1. Ensure GeckoDriver is installed and configured
2. Create or reuse Firefox profile
3. Launch Firefox with desired capabilities
4. Navigate and interact with pages
5. Handle Firefox-specific quirks
6. Capture data or perform actions
7. Close browser cleanly
```

## Best Practices
- Use latest GeckoDriver for best compatibility
- Configure appropriate privacy settings
- Handle Firefox-specific CSS/JS differences
- Test with both standard and ESR versions
- Clean up profile data after automation
