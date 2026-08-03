---
name: clipboard-manager
description: Clipboard operations. Copy/paste automation, clipboard history, format conversion.
---

# Clipboard Manager

## When to Apply
Use when automating copy/paste operations, managing clipboard history, converting clipboard formats, or transferring data between applications.

## Core Concepts
- **Copy/paste automation**: Standard clipboard operations
- **Clipboard history**: Track recent clipboard contents
- **Format conversion**: Handle text, images, files
- **Rich text handling**: Preserve formatting when needed
- **Multiple formats**: Handle different data types
- **Clipboard monitoring**: Watch for clipboard changes

## Implementation
```
1. Check current clipboard state
2. Save clipboard content if needed
3. Perform copy operation
4. Convert format if required
5. Perform paste operation
6. Restore original clipboard if needed
7. Verify data transfer success
```

## Best Practices
- Always save and restore clipboard when needed
- Handle both text and binary clipboard data
- Respect application-specific paste behaviors
- Clean up sensitive data from clipboard
- Use appropriate delays for clipboard operations
