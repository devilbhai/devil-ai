---
name: folder-manager
description: Folder operations. Directory creation, organization, cleanup, backup management.
---

# Folder Manager

## When to Apply
Use when organizing directory structures, cleaning up files, managing backups, or automating file organization tasks.

## Core Concepts
- **Directory creation**: Create nested directory structures
- **File organization**: Sort files by type, date, name
- **Cleanup operations**: Remove old or unnecessary files
- **Backup management**: Create and manage backups
- **Permission management**: Set appropriate directory permissions
- **Symbolic links**: Create and manage symlinks

## Implementation
```
1. Analyze current directory structure
2. Define organization rules
3. Create required directories
4. Move/copy files to new locations
5. Clean up empty or old directories
6. Verify organization completed
7. Update any references to moved files
```

## Best Practices
- Always backup before major reorganization
- Handle symbolic links correctly
- Preserve directory timestamps when needed
- Use atomic operations where possible
- Log all file movements for auditing
