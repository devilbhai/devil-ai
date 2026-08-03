---
name: jotai-deep
description: Advanced Jotai patterns including atom families, derived atoms, async atoms, persistence, and performance optimization for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Jotai Deep Patterns

Advanced Jotai patterns for state management in the Devil AI codebase.

## When to Apply

- Creating new atoms and state logic
- Optimizing re-renders with derived state
- Persisting state to storage
- Working with async data
- Building atom families for dynamic data

---

## 1. Atom Basics & Best Practices

### Atom Organization

```typescript
// ✅ atoms/index.ts - Central export
export { userAtom, userIdAtom } from "./user"
export { themeAtom, fontSizeAtom } from "./settings"
export { sessionAtoms } from "./sessions"
```

### Atom Naming Convention

```typescript
// ✅ camelCase with 'Atom' suffix
export const userAtom = atom<User | null>(null)
export const isLoadingAtom = atom<boolean>(false)
export const selectedIdsAtom = atom<string[]>([])

// ✅ Derived atoms use descriptive names
export const currentUserAtom = atom((get) => {
  const user = get(userAtom)
  const userId = get(userIdAtom)
  return user?.id === userId ? user : null
})
```

### Atom File Structure

```typescript
// ✅ atoms/user.ts
import { atom } from "jotai"
import { atomsWithQuery } from "jotai-tanstack-query"

// --- State ---
export const userIdAtom = atom<string | null>(null)

// --- Derived ---
export const userAtom = atom((get) => {
  const userId = get(userIdAtom)
  if (!userId) return null
  // Fetch or return cached
})

// --- Actions ---
export const setUserAtom = atom(null, (get, set, user: User) => {
  set(userAtom, user)
  set(userIdAtom, user.id)
})
```

---

## 2. Derived Atoms

### Computed Values

```typescript
// ✅ Simple derivation
export const fullNameAtom = atom((get) => {
  const firstName = get(firstNameAtom)
  const lastName = get(lastNameAtom)
  return `${firstName} ${lastName}`
})

// ✅ Conditional derivation
export const displayUserAtom = atom((get) => {
  const user = get(userAtom)
  const isLoading = get(isLoadingAtom)
  
  if (isLoading) return { status: "loading" as const }
  if (!user) return { status: "unauthenticated" as const }
  return { status: "authenticated" as const, user }
})
```

### Read-Write Derived Atoms

```typescript
// ✅ Bidirectional derived atom
export const temperatureAtom = atom(
  // Read
  (get) => {
    const celsius = get(celsiusAtom)
    return (celsius * 9) / 5 + 32
  },
  // Write
  (get, set, fahrenheit: number) => {
    set(celsiusAtom, ((fahrenheit - 32) * 5) / 9)
  }
)

// ✅ Complex read-write derived
export const filtersAtom = atom(
  (get) => ({
    search: get(searchAtom),
    category: get(categoryAtom),
    sortBy: get(sortByAtom),
  }),
  (get, set, update: Partial<Filters>) => {
    const current = {
      search: get(searchAtom),
      category: get(categoryAtom),
      sortBy: get(sortByAtom),
    }
    const next = { ...current, ...update }
    
    set(searchAtom, next.search)
    set(categoryAtom, next.category)
    set(sortByAtom, next.sortBy)
  }
)
```

### Chained Derivations

```typescript
// ✅ Build complex state from multiple atoms
export const filteredUsersAtom = atom((get) => {
  const users = get(usersAtom)
  const search = get(searchAtom)
  const role = get(roleFilterAtom)
  
  return users
    .filter((u) => 
      u.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => !role || u.role === role)
})

// ✅ Derived with async
export const userWithPostsAtom = atom(async (get) => {
  const user = get(userAtom)
  if (!user) return null
  
  const posts = await fetchPosts(user.id)
  return { ...user, posts }
})
```

---

## 3. Atom Families

### Basic Atom Family

```typescript
// ✅ For dynamic/per-item state
import { atomFamily } from "jotai/utils"

// One atom per user ID
export const userAtomFamily = atomFamily((userId: string) =>
  atom(async () => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json() as Promise<User>
  })
)

// Usage
const user1 = useAtomValue(userAtomFamily("user-1"))
const user2 = useAtomValue(userAtomFamily("user-2"))
```

### Parameterized Families with Utils

```typescript
// ✅ Session atoms for multi-session support
import { atomFamily, atomWithStorage } from "jotai/utils"

export const sessionAtomFamily = atomFamily(
  (sessionId: string) =>
    atomWithStorage(`session-${sessionId}`, {
      id: sessionId,
      messages: [] as Message[],
      isLoading: false,
      error: null as Error | null,
    }),
  // Custom equality check to prevent unnecessary re-renders
  (a, b) => a === b
)

// Usage in component
function ChatSession({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useAtom(sessionAtomFamily(sessionId))
  
  const addMessage = (message: Message) => {
    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }
}
```

### Families with Dependencies

```typescript
// ✅ Family that depends on other atoms
export const messageAtomFamily = atomFamily(
  (sessionId: string) =>
    atom((get) => {
      const session = get(sessionAtomFamily(sessionId))
      const currentUser = get(currentUserAtom)
      
      return session.messages.map((msg) => ({
        ...msg,
        isOwn: msg.authorId === currentUser?.id,
      }))
    })
)
```

---

## 4. Async Atoms

### Basic Async

```typescript
// ✅ Async atom for data fetching
export const userAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  if (!userId) return null
  
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) throw new Error("Failed to fetch user")
  return response.json() as Promise<User>
})

// ✅ Using with suspense
function UserProfile() {
  const user = useAtomValue(userAtom) // Suspends until resolved
  return <div>{user?.name}</div>
}
```

### Async with Loading State

```typescript
// ✅ Track loading and error states
export const userQueryAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  if (!userId) return { data: null, isLoading: false, error: null }
  
  try {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    return { data, isLoading: false, error: null }
  } catch (error) {
    return { data: null, isLoading: false, error }
  }
})

// ✅ Separate loading atom
export const userLoadingAtom = atom(true)
export const userErrorAtom = atom<Error | null>(null)

export const fetchUserAtom = atom(null, async (get, set, userId: string) => {
  set(userLoadingAtom, true)
  set(userErrorAtom, null)
  
  try {
    const response = await fetch(`/api/users/${userId}`)
    const user = await response.json()
    set(userAtom, user)
  } catch (error) {
    set(userErrorAtom, error instanceof Error ? error : new Error("Unknown error"))
  } finally {
    set(userLoadingAtom, false)
  }
})
```

### Async with TanStack Query

```typescript
// ✅ Using jotai-tanstack-query for caching
import { atomsWithQuery } from "jotai-tanstack-query"

export const [userAtom, userStatusAtom] = atomsWithQuery((get) => ({
  queryKey: ["user", get(userIdAtom)],
  queryFn: async ({ queryKey }) => {
    const [, userId] = queryKey
    if (!userId) return null
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
  enabled: !!get(userIdAtom),
}))
```

---

## 5. Write Atoms (Actions)

### Action Atoms

```typescript
// ✅ Action atom for complex state updates
export const addMessageAtom = atom(
  null,
  (get, set, message: Message) => {
    const sessionId = get(currentSessionIdAtom)
    if (!sessionId) return
    
    set(sessionAtomFamily(sessionId), (prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }
)

// ✅ Async action atom
export const sendMessageAtom = atom(
  null,
  async (get, set, content: string) => {
    const sessionId = get(currentSessionIdAtom)
    const user = get(currentUserAtom)
    if (!sessionId || !user) return
    
    const message: Message = {
      id: crypto.randomUUID(),
      content,
      authorId: user.id,
      timestamp: Date.now(),
    }
    
    // Optimistic update
    set(addMessageAtom, message)
    
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      })
    } catch (error) {
      // Revert on error
      set(removeMessageAtom, message.id)
    }
  }
)
```

### Multiple State Updates

```typescript
// ✅ Update multiple atoms at once
export const resetSessionAtom = atom(null, (get, set) => {
  set(messagesAtom, [])
  set(currentInputAtom, "")
  set(isLoadingAtom, false)
  set(errorAtom, null)
})

// ✅ Batch updates with transaction
export const loginUserAtom = atom(
  null,
  async (get, set, credentials: { email: string; password: string }) => {
    try {
      const user = await authApi.login(credentials)
      
      // All these updates are batched
      set(userAtom, user)
      set(isAuthenticatedAtom, true)
      set(errorAtom, null)
      set(lastLoginAtom, Date.now())
    } catch (error) {
      set(errorAtom, error instanceof Error ? error : new Error("Login failed"))
      set(isAuthenticatedAtom, false)
    }
  }
)
```

---

## 6. Persistence

### atomWithStorage

```typescript
// ✅ Persist to localStorage
import { atomWithStorage } from "jotai/utils"

export const themeAtom = atomWithStorage("theme", "light")
export const fontSizeAtom = atomWithStorage("fontSize", 16)
export const sidebarOpenAtom = atomWithStorage("sidebarOpen", true)

// ✅ With custom storage
export const settingsAtom = atomWithStorage(
  "settings",
  defaultSettings,
  {
    getItem: (key) => {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    removeItem: (key) => {
      localStorage.removeItem(key)
    },
  }
)
```

### Async Storage (Electron)

```typescript
// ✅ Persist to Electron's storage
import { atomWithStorage } from "jotai/utils"

// Custom async storage for Electron
const electronStorage = {
  getItem: async (key: string) => {
    const value = await window.devilAi?.storage.get(key)
    return value ?? null
  },
  setItem: async (key: string, value: unknown) => {
    await window.devilAi?.storage.set(key, value)
  },
  removeItem: async (key: string) => {
    await window.devilAi?.storage.delete(key)
  },
}

export const userPreferencesAtom = atomWithStorage(
  "userPreferences",
  defaultPreferences,
  electronStorage
)
```

### Sync Storage with Migration

```typescript
// ✅ Versioned storage with migration
interface SettingsV1 {
  theme: string
}

interface SettingsV2 {
  theme: "light" | "dark" | "system"
  fontSize: number
}

const migrateSettings = (data: unknown): SettingsV2 => {
  const v1 = data as SettingsV1
  return {
    theme: v1.theme as "light" | "dark" | "system",
    fontSize: 16,
  }
}

export const settingsAtom = atomWithStorage<SettingsV2>(
  "settings",
  { theme: "system", fontSize: 16 },
  {
    getItem: (key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const data = JSON.parse(raw)
      // Check version and migrate if needed
      return migrateSettings(data)
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
  }
)
```

---

## 7. Performance Optimization

### Selective Subscriptions

```typescript
// ✅ Only re-render when specific field changes
export const userNameAtom = atom((get) => get(userAtom)?.name ?? "")

// ✅ Use selector pattern
function UserName() {
  const name = useAtomValue(userNameAtom) // Only re-renders when name changes
  return <span>{name}</span>
}

// ✅ Avoid this - re-renders on any user change
function UserNameBad() {
  const user = useAtomValue(userAtom) // Re-renders when any field changes
  return <span>{user?.name}</span>
}
```

### Memoized Derivations

```typescript
// ✅ Expensive computation memoized
export const sortedUsersAtom = atom((get) => {
  const users = get(usersAtom)
  const sortBy = get(sortByAtom)
  
  // This only recomputes when users or sortBy changes
  return [...users].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    if (sortBy === "date") return b.createdAt - a.createdAt
    return 0
  })
})

// ✅ Filtered and memoized
export const filteredAndSortedUsersAtom = atom((get) => {
  const users = get(usersAtom)
  const search = get(searchAtom)
  const sortBy = get(sortByAtom)
  
  return users
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
})
```

### Avoid Unnecessary Re-renders

```typescript
// ✅ Use primitive dependencies
export const userAgeAtom = atom((get) => get(userAtom)?.age ?? 0)

// ✅ Extract primitive from object
export const isActiveAtom = atom((get) => get(userAtom)?.isActive ?? false)

// ✅ Use atomFamily for per-item state (prevents all items re-rendering)
const itemAtomFamily = atomFamily((id: string) => atom(getItem(id)))

function Item({ id }: { id: string }) {
  const item = useAtomValue(itemAtomFamily(id)) // Only this item re-renders
  return <div>{item.name}</div>
}
```

---

## 8. Debugging

### DevTools Integration

```typescript
// ✅ Enable Jotai DevTools
import { useAtomsDevtools } from "jotai-devtools"

function App() {
  useAtomsDevtools("Devil AI")
  return <AppContent />
}

// ✅ Custom logging
import { createStore } from "jotai"

const store = createStore()

if (import.meta.env.DEV) {
  store.sub(userAtom, () => {
    console.log("userAtom changed:", store.get(userAtom))
  })
}
```

### Atom Debug Labels

```typescript
// ✅ Add debug labels for DevTools
import {atomWithStorage} from "jotai/utils"

export const userAtom = atom<User | null>(null)
userAtom.debugLabel = "currentUser"

export const themeAtom = atomWithStorage("theme", "light")
themeAtom.debugLabel = "themePreference"
```

---

## 9. Common Patterns

### Global UI State

```typescript
// ✅ atoms/ui.ts
export const sidebarOpenAtom = atomWithStorage("sidebarOpen", true)
export const themeAtom = atomWithStorage<"light" | "dark">("theme", "light")
export const commandPaletteOpenAtom = atom(false)
export const notificationsAtom = atom<Notification[]>([])
```

### Form State

```typescript
// ✅ atoms/form.ts
export const formAtomFamily = atomFamily(
  (formId: string) =>
    atom({
      values: {} as Record<string, unknown>,
      errors: {} as Record<string, string>,
      isSubmitting: false,
      isDirty: false,
    })
)

// ✅ Form actions
export const updateFormFieldAtom = atom(
  null,
  (get, set, { formId, field, value }: {
    formId: string
    field: string
    value: unknown
  }) => {
    set(formAtomFamily(formId), (prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      isDirty: true,
    }))
  }
)
```

### Multi-Tab/Session State

```typescript
// ✅ atoms/sessions.ts
export const sessionsAtom = atom<Session[]>([])
export const activeSessionIdAtom = atom<string | null>(null)

export const activeSessionAtom = atom((get) => {
  const sessions = get(sessionsAtom)
  const activeId = get(activeSessionIdAtom)
  return sessions.find((s) => s.id === activeId) ?? null
})

// ✅ Per-session state
export const sessionMessagesAtomFamily = atomFamily(
  (sessionId: string) => atom<Message[]>([])
)
```

---

## 10. Integration with React 19

### Using with Suspense

```tsx
// ✅ Async atom with Suspense
function UserProfile() {
  const user = useAtomValue(userAtom) // Suspends until resolved
  return <div>{user.name}</div>
}

// ✅ Wrapper with Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  )
}
```

### Using with ErrorBoundary

```tsx
// ✅ Error handling with async atoms
function UserProfile() {
  const [user, error] = useAtomValue(userAtom)
  
  if (error) return <ErrorDisplay error={error} />
  if (!user) return <NotFound />
  
  return <div>{user.name}</div>
}
```

### Server-Side Rendering

```typescript
// ✅ SSR-safe initialization
import { useHydrateAtoms } from "jotai/utils"

function App({ initialData }: { initialData: InitialData }) {
  useHydrateAtoms([
    [userAtom, initialData.user],
    [settingsAtom, initialData.settings],
  ])
  
  return <AppContent />
}
```

---

## Best Practices

1. **Organize atoms by feature** — Group related atoms in separate files
2. **Use camelCase with Atom suffix** — `userAtom`, `isLoadingAtom`
3. **Prefer derived atoms over effects** — Derive state during render, not in effects
4. **Use atomFamily for dynamic data** — One atom per item prevents all-item re-renders
5. **Primitive dependencies only** — Pass primitives to selectors to minimize re-renders
6. **Action atoms for complex updates** — Keep write logic in separate atoms
7. **atomWithStorage for persistence** — Automatic localStorage sync
8. **Debug labels for DevTools** — Makes debugging easier
9. **Async atoms with Suspense** — Let React handle loading states
10. **Test atoms in isolation** — Atoms are pure functions, easy to test
