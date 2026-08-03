---
name: file-system
description: Electron file system operations, safe reads/writes, file watchers, XDG paths, and secure file handling for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# File System Patterns

File system patterns for the Devil AI Electron app.

## When to Apply

- Reading/writing files
- Watching file changes
- Managing app data directories
- Handling user file selection
- Secure file operations

---

## 1. Directory Structure

### XDG Base Directory

```typescript
// ✅ main/directories.ts
import { app } from "electron"
import path from "node:path"
import os from "node:os"

// ✅ Follow XDG Base Directory Specification
export const directories = {
  // Config: ~/.config/devil-ai/
  config: path.join(
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
    "devil-ai"
  ),
  
  // Data: ~/.local/share/devil-ai/
  data: path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
    "devil-ai"
  ),
  
  // Cache: ~/.cache/devil-ai/
  cache: path.join(
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"),
    "devil-ai"
  ),
  
  // Logs: ~/.local/state/devil-ai/log/
  logs: path.join(
    process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state"),
    "devil-ai",
    "log"
  ),
}

// ✅ Create directories on startup
export async function ensureDirectories(): Promise<void> {
  for (const dir of Object.values(directories)) {
    await Bun.write(path.join(dir, ".gitkeep"), "")
  }
}
```

### App Paths

```typescript
// ✅ Electron app paths
import { app } from "electron"
import path from "node:path"

export const appPaths = {
  // App root
  root: app.getAppPath(),
  
  // Resources
  resources: path.join(app.getAppPath(), "resources"),
  
  // User data (Electron default)
  userData: app.getPath("userData"),
  
  // Temp
  temp: app.getPath("temp"),
  
  // Desktop
  desktop: app.getPath("desktop"),
  
  // Documents
  documents: app.getPath("documents"),
  
  // Downloads
  downloads: app.getPath("downloads"),
}
```

---

## 2. Safe File Operations

### Read File

```typescript
// ✅ Safe file read
import fs from "node:fs/promises"
import path from "node:path"

export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return content
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist
      return null
    }
    throw error
  }
}

// ✅ Read JSON file
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const content = await safeReadFile(filePath)
  if (!content) return null
  
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}
```

### Write File

```typescript
// ✅ Safe file write
import fs from "node:fs/promises"
import path from "node:path"

export async function safeWriteFile(
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    // ✅ Ensure directory exists
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    // ✅ Write to temp file first, then rename (atomic write)
    const tempPath = `${filePath}.tmp`
    await fs.writeFile(tempPath, content, "utf-8")
    await fs.rename(tempPath, filePath)
    
    return true
  } catch (error) {
    console.error("Failed to write file:", error)
    return false
  }
}

// ✅ Write JSON file
export async function writeJsonFile<T>(
  filePath: string,
  data: T
): Promise<boolean> {
  return safeWriteFile(filePath, JSON.stringify(data, null, 2))
}
```

### Delete File

```typescript
// ✅ Safe file delete
import fs from "node:fs/promises"

export async function safeDeleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist
      return true
    }
    console.error("Failed to delete file:", error)
    return false
  }
}
```

---

## 3. File Watching

### Watch File Changes

```typescript
// ✅ main/file-watcher.ts
import { watch, FSWatcher } from "fs"
import path from "node:path"

export class FileWatcher {
  private watchers = new Map<string, FSWatcher>()
  
  watch(
    filePath: string,
    callback: (event: "change" | "rename", filename: string | null) => void
  ): () => void {
    const watcher = watch(filePath, (event, filename) => {
      callback(event, filename)
    })
    
    this.watchers.set(filePath, watcher)
    
    // Return cleanup function
    return () => {
      watcher.close()
      this.watchers.delete(filePath)
    }
  }
  
  watchDirectory(
    dirPath: string,
    callback: (event: "change" | "rename", filename: string | null) => void
  ): () => void {
    const watcher = watch(dirPath, { recursive: true }, (event, filename) => {
      callback(event, filename)
    })
    
    this.watchers.set(dirPath, watcher)
    
    return () => {
      watcher.close()
      this.watchers.delete(dirPath)
    }
  }
  
  unwatchAll(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close()
    }
    this.watchers.clear()
  }
}
```

### React Hook for File Watching

```typescript
// ✅ hooks/use-file-watcher.ts
import { useEffect, useState } from "react"

export function useFileWatcher(filePath: string) {
  const [lastModified, setLastModified] = useState<Date | null>(null)
  
  useEffect(() => {
    if (!filePath) return
    
    const cleanup = window.devilAi?.on("file:changed", (event) => {
      if (event.path === filePath) {
        setLastModified(new Date())
      }
    })
    
    return () => {
      cleanup?.()
    }
  }, [filePath])
  
  return lastModified
}
```

---

## 4. Dialog Integration

### Open File Dialog

```typescript
// ✅ main/dialogs.ts
import { dialog, BrowserWindow } from "electron"

export async function openFileDialog(
  window: BrowserWindow,
  options?: {
    filters?: { name: string; extensions: string[] }[]
    multiSelections?: boolean
  }
): Promise<string[]> {
  const result = await dialog.showOpenDialog(window, {
    properties: [
      "openFile",
      ...(options?.multiSelections ? ["multiSelections" as const] : []),
    ],
    filters: options?.filters,
  })
  
  if (result.canceled) {
    return []
  }
  
  return result.filePaths
}

// ✅ Save file dialog
export async function saveFileDialog(
  window: BrowserWindow,
  options?: {
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }
): Promise<string | null> {
  const result = await dialog.showSaveDialog(window, {
    defaultPath: options?.defaultPath,
    filters: options?.filters,
  })
  
  if (result.canceled || !result.filePath) {
    return null
  }
  
  return result.filePath
}
```

### Usage in Renderer

```typescript
// ✅ renderer/services/file-dialog.ts
export async function openFile(): Promise<string | null> {
  const filePaths = await window.devilAi?.invoke("dialog:openFile", {
    filters: [
      { name: "Markdown", extensions: ["md", "markdown"] },
      { name: "Text", extensions: ["txt"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })
  
  return filePaths?.[0] ?? null
}

export async function saveFile(content: string, defaultPath?: string): Promise<boolean> {
  const filePath = await window.devilAi?.invoke("dialog:saveFile", {
    defaultPath,
    filters: [
      { name: "Markdown", extensions: ["md"] },
      { name: "Text", extensions: ["txt"] },
    ],
  })
  
  if (!filePath) return false
  
  return window.devilAi?.invoke("file:write", { path: filePath, content }) ?? false
}
```

---

## 5. File Operations IPC

### IPC Handlers

```typescript
// ✅ main/ipc/file-handlers.ts
import fs from "node:fs/promises"
import path from "node:path"

export const fileHandlers = {
  "file:read": async (params: { path: string }) => {
    const content = await fs.readFile(params.path, "utf-8")
    return content
  },
  
  "file:write": async (params: { path: string; content: string }) => {
    // ✅ Ensure directory exists
    const dir = path.dirname(params.path)
    await fs.mkdir(dir, { recursive: true })
    
    // ✅ Atomic write
    const tempPath = `${params.path}.tmp`
    await fs.writeFile(tempPath, params.content, "utf-8")
    await fs.rename(tempPath, params.path)
  },
  
  "file:exists": async (params: { path: string }) => {
    try {
      await fs.access(params.path)
      return true
    } catch {
      return false
    }
  },
  
  "file:stat": async (params: { path: string }) => {
    const stat = await fs.stat(params.path)
    return {
      size: stat.size,
      modified: stat.mtime.toISOString(),
      created: stat.birthtime.toISOString(),
    }
  },
  
  "file:list": async (params: { dirPath: string }) => {
    const entries = await fs.readdir(params.dirPath, { withFileTypes: true })
    return entries.map((entry) => ({
      name: entry.name,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
    }))
  },
}
```

---

## 6. Best Practices

1. **Use XDG directories** — Follow platform conventions
2. **Atomic writes** — Write to temp file, then rename
3. **Handle ENOENT** — Check if file exists before operations
4. **Validate paths** — Prevent path traversal attacks
5. **Use IPC for file ops** — Don't use fs in renderer
6. **Watch for changes** — Update UI when files change
7. **Clean up temp files** — Remove .tmp files on error
8. **Error handling** — Graceful degradation
9. **Permissions** — Check file permissions before operations
10. **Performance** — Use async operations, avoid blocking
