---
name: electron-security
description: Electron security patterns, context isolation, preload scripts, CSP, and permission policies for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Electron Security Patterns

Security best practices for the Devil AI Electron app.

## When to Apply

- Configuring Electron security settings
- Setting up preload scripts
- Implementing Content Security Policy
- Handling permissions
- Securing IPC communication

---

## 1. Context Isolation

### Enable Context Isolation

```typescript
// ✅ main/index.ts
import { app, BrowserWindow } from "electron"

app.whenReady().then(() => {
  const win = new BrowserWindow({
    webPreferences: {
      // ✅ Enable context isolation (REQUIRED)
      contextIsolation: true,
      
      // ✅ Disable node integration (REQUIRED)
      nodeIntegration: false,
      
      // ✅ Enable sandbox (RECOMMENDED)
      sandbox: true,
      
      // ✅ Disable remote module
      enableRemoteModule: false,
      
      // ✅ Set preload script
      preload: path.join(__dirname, "../preload/index.js"),
      
      // ✅ Disable webview tag
      webviewTag: false,
      
      // ✅ Disable navigation
      navigation: {
        disableNavigation: true,
      },
    },
  })
})
```

### Why Context Isolation

```
❌ Without Context Isolation:
Renderer Process → Can access Node.js APIs → Security Risk

✅ With Context Isolation:
Renderer Process → Preload Bridge → Main Process → Safe
```

---

## 2. Preload Script Security

### Minimal Preload

```typescript
// ✅ preload/index.ts
import { contextBridge, ipcRenderer } from "electron"

// ✅ Expose minimal API
contextBridge.exposeInMainWorld("devilAi", {
  // Only expose specific methods
  getUser: (id: string) => ipcRenderer.invoke("user:get", { id }),
  
  // Don't expose ipcRenderer directly
  // ❌ ipcRenderer: ipcRenderer
  
  // Don't expose dangerous methods
  // ❌ exec: (cmd) => ipcRenderer.invoke("exec", cmd)
})
```

### Type-Safe Preload

```typescript
// ✅ preload/types.ts
export interface DevilAiAPI {
  getUser: (params: { id: string }) => Promise<User | null>
  getSettings: () => Promise<Settings>
  onNotification: (callback: (notification: Notification) => void) => () => void
}

// ✅ preload/index.ts
contextBridge.exposeInMainWorld("devilAi", {
  getUser: (params: { id: string }) => ipcRenderer.invoke("user:get", params),
  
  getSettings: () => ipcRenderer.invoke("settings:get"),
  
  onNotification: (callback: (notification: Notification) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, notification: Notification) => {
      callback(notification)
    }
    
    ipcRenderer.on("notification:new", handler)
    
    return () => {
      ipcRenderer.removeListener("notification:new", handler)
    }
  },
} satisfies DevilAiAPI)
```

---

## 3. Content Security Policy

### CSP Headers

```typescript
// ✅ main/csp.ts
export function getCSP(): string {
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", "http://localhost:*"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  }
  
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ")
}
```

### Set CSP Headers

```typescript
// ✅ main/index.ts
import { session } from "electron"

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [getCSP()],
      },
    })
  })
})
```

---

## 4. Permission Handling

### Permission Requests

```typescript
// ✅ main/permissions.ts
import { session } from "electron"

const PERMISSION_POLICIES: Record<string, boolean> = {
  // ✅ Allow
  "media": true,
  "notifications": true,
  "clipboard-read": true,
  "clipboard-sanitized-write": true,
  
  // ❌ Deny
  "geolocation": false,
  "midi": false,
  "pointer-lock": false,
  "fullscreen": false,
  "openExternal": false,
}

export function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const url = webContents.getURL()
      
      // ✅ Only allow for your app
      if (!url.startsWith("file://") && !url.startsWith("http://localhost")) {
        callback(false)
        return
      }
      
      // ✅ Check permission policy
      const allowed = PERMISSION_POLICIES[permission] ?? false
      
      console.log(`[Permission] ${permission} -> ${allowed ? "granted" : "denied"}`)
      
      callback(allowed)
    }
  )
}
```

### External URL Handling

```typescript
// ✅ main/navigation.ts
import { shell } from "electron"

export function setupNavigation(window: BrowserWindow): void {
  // ✅ Deny navigation to untrusted URLs
  window.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url)
    
    // Allow local files and localhost
    if (
      parsedUrl.protocol === "file:" ||
      (parsedUrl.hostname === "localhost" && parsedUrl.port === "1420")
    ) {
      return
    }
    
    // ✅ Open external URLs in browser
    event.preventDefault()
    shell.openExternal(url)
  })
  
  // ✅ Handle new window requests
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
}
```

---

## 5. IPC Security

### Validate IPC Calls

```typescript
// ✅ main/ipc/validate.ts
const ALLOWED_CHANNELS = new Set([
  "user:get",
  "user:update",
  "session:list",
  "settings:get",
  "settings:update",
])

export function validateChannel(channel: string): boolean {
  return ALLOWED_CHANNELS.has(channel)
}

// ✅ Validate sender
export function validateSender(event: Electron.IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url
  
  if (!url) {
    return false
  }
  
  return url.startsWith("file://") || url.startsWith("http://localhost")
}
```

### Secure Handler Registration

```typescript
// ✅ main/ipc/index.ts
import { ipcMain } from "electron"
import { validateChannel, validateSender } from "./validate"
import { withLogging } from "./with-logging"

export function registerIPCHandlers(): void {
  ipcMain.handle("ipc:invoke", withLogging("ipc:invoke", async (event, channel, ...args) => {
    // ✅ Validate sender
    if (!validateSender(event)) {
      throw new Error("Invalid sender")
    }
    
    // ✅ Validate channel
    if (!validateChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`)
    }
    
    // ✅ Get handler
    const handler = handlers[channel]
    if (!handler) {
      throw new Error(`No handler for channel: ${channel}`)
    }
    
    return handler(...args)
  }))
}
```

---

## 6. Secure Storage

### Store Secrets Securely

```typescript
// ✅ main/secure-storage.ts
import { safeStorage } from "electron"

export class SecureStorage {
  // ✅ Encrypt sensitive data
  static async encrypt(key: string, value: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Encryption not available")
    }
    
    const encrypted = safeStorage.encryptString(value)
    // Store encrypted buffer
    await this.store(key, encrypted)
  }
  
  // ✅ Decrypt sensitive data
  static async decrypt(key: string): Promise<string | null> {
    const encrypted = await this.retrieve(key)
    if (!encrypted) {
      return null
    }
    
    return safeStorage.decryptString(Buffer.from(encrypted))
  }
  
  // Don't store plaintext
  // ❌ localStorage.setItem(key, value)
  
  // ✅ Use encrypted storage
  // ✅ Use OS keychain
}
```

---

## 7. Development Security

### Dev Mode Checks

```typescript
// ✅ main/security-checks.ts
export function performSecurityChecks(): void {
  // ✅ Check if running in development
  const isDev = process.env.NODE_ENV === "development"
  
  if (isDev) {
    console.warn("[Security] Running in development mode")
    
    // ✅ Enable DevTools in dev only
    app.whenReady().then(() => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.openDevTools()
      }
    })
  } else {
    // ✅ Disable DevTools in production
    app.whenReady().then(() => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.closeDevTools()
      }
    })
  }
}
```

### Disable Dangerous Features

```typescript
// ✅ main/index.ts
app.whenReady().then(() => {
  // ✅ Disable electron-spellchecker if not needed
  // ✅ Disable auto-update if not needed
  // ✅ Disable crash reporter if not needed
  
  // ✅ Set user agent
  app.userAgentFallback = "Devil AI Desktop App"
})
```

---

## 8. Checklist

### Security Checklist

```
✅ Context Isolation enabled
✅ Node Integration disabled
✅ Sandbox enabled
✅ Preload script minimal
✅ CSP headers set
✅ Permissions restricted
✅ External navigation blocked
✅ IPC channels validated
✅ Sender validated
✅ Secrets encrypted
✅ DevTools disabled in production
✅ User agent set
✅ Webview tag disabled
✅ Remote module disabled
```

---

## Best Practices

1. **Always enable context isolation** — Never disable it
2. **Never expose ipcRenderer** — Only specific invoke methods
3. **Validate all IPC calls** — Check channel and sender
4. **Set CSP headers** — Block unauthorized sources
5. **Restrict permissions** — Only allow what's needed
6. **Block external navigation** — Prevent phishing
7. **Encrypt sensitive data** — Use safeStorage
8. **Disable DevTools in production** — Prevent tampering
9. **Regular security audits** — Check for vulnerabilities
10. **Stay updated** — Keep Electron and dependencies current
