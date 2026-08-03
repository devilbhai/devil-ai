---
name: vscode-controller
description: VS Code automation. Extension management, workspace configuration, task execution, terminal control.
---

# VS Code Controller

## When to Apply
Use this skill when automating VS Code operations: managing extensions, configuring workspaces, running tasks or terminals, or manipulating editor settings programmatically.

## Core Concepts
- VS Code extensions are managed via `code --install-extension` / `code --uninstall-extension`
- Workspace settings live in `.vscode/settings.json`
- Tasks are defined in `.vscode/tasks.json`
- Launch configurations live in `.vscode/launch.json`
- Keybindings are customized in `keybindings.json`

## Implementation

### Extension Management
```bash
# Install extension
code --install-extension <extension-id>

# Uninstall extension
code --uninstall-extension <extension-id>

# List installed extensions
code --list-extensions

# Export extensions
code --list-extensions > extensions.txt

# Import extensions
cat extensions.txt | xargs -L 1 code --install-extension
```

### Workspace Configuration
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.exclude": { "node_modules": true, "dist": true },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Task Execution
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "bun run build",
      "group": { "kind": "build", "isDefault": true }
    }
  ]
}
```

### Terminal Control via API
```typescript
// Using VS Code API
const terminal = vscode.window.createTerminal("My Terminal");
terminal.sendText("bun run dev");
terminal.show();
```

## Best Practices
- Use extension IDs (publisher.name) not display names for reliability
- Pin extension versions in CI with `--install-extension id@version`
- Keep `.vscode/settings.json` in version control for team consistency
- Use workspace-specific settings over user settings for reproducibility
