---
name: vue-expert
description: Vue.js development. Composition API, Pinia state management, Vue Router, Nuxt.js.
---

# Vue Expert

## When to Apply
Use this skill when developing Vue.js applications: using Composition API, managing state with Pinia, routing with Vue Router, or building with Nuxt.js.

## Core Concepts
- Composition API: `setup()`, `ref()`, `reactive()`, `computed()`, `watch()`
- Pinia: type-safe state management (successor to Vuex)
- Vue Router: SPA routing with `useRoute()`, `useRouter()`
- Nuxt.js: server-side rendering, auto-imports, file-based routing
- Single File Components (SFC): `<template>`, `<script setup>`, `<style>`

## Implementation

### Component with Composition API
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useUserStore } from "@/stores/user"

interface Props {
  userId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<{
  update: [user: User]
  delete: [id: string]
}>()

const store = useUserStore()
const loading = ref(false)
const user = computed(() => store.getUser(props.userId))

onMounted(async () => {
  loading.value = true
  await store.fetchUser(props.userId)
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="user">
    <h1>{{ user.name }}</h1>
    <button v-if="editable" @click="emit('update', user)">Edit</button>
  </div>
</template>
```

### Pinia Store
```typescript
// stores/user.ts
import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useUserStore = defineStore("user", () => {
  const users = ref<Map<string, User>>(new Map())
  const loading = ref(false)

  const getUser = computed(() => (id: string) => users.value.get(id))

  async function fetchUser(id: string) {
    loading.value = true
    try {
      const user = await api.getUser(id)
      users.value.set(id, user)
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: string, data: Partial<User>) {
    const user = await api.updateUser(id, data)
    users.value.set(id, user)
  }

  return { users, loading, getUser, fetchUser, updateUser }
})
```

### Vue Router
```typescript
// router/index.ts
import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
    },
    {
      path: "/user/:id",
      component: () => import("@/views/User.vue"),
      props: true,
    },
  ],
})

export default router
```

### Nuxt.js Patterns
```typescript
// pages/index.vue
<script setup lang="ts">
// Auto-imported composables
const { data: users } = await useFetch("/api/users")

// SEO
useHead({
  title: "Users",
  meta: [{ name: "description", content: "User listing" }],
})
</script>

<template>
  <div>
    <NuxtLink v-for="user in users" :key="user.id" :to="`/user/${user.id}`">
      {{ user.name }}
    </NuxtLink>
  </div>
</template>
```

### Composables
```typescript
// composables/useDebounce.ts
import { ref, watch } from "vue"

export function useDebounce<T>(value: Ref<T>, delay: number = 300) {
  const debounced = ref(value.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newVal) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  })

  return debounced
}
```

## Best Practices
- Use `<script setup>` for cleaner component syntax
- Prefer Composition API over Options API for new projects
- Use `defineProps` and `defineEmits` with TypeScript for type safety
- Keep stores focused; use composables for reusable logic
- Use `v-if` over `v-show` for conditional rendering (avoids hidden DOM)
- Lazy-load route components with dynamic `import()`
- Use `shallowRef` for large objects to avoid deep reactivity overhead
