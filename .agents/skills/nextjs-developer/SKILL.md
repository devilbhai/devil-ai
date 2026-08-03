---
name: nextjs-developer
description: Next.js App Router expert. Covers server components, server actions, ISR, SSR, streaming, parallel routes, intercepting routes, metadata API, image optimization, font optimization.
---

# Next.js App Router Expert

## When to Apply
Use this skill when working with Next.js 13+ (App Router) projects. Apply when:
- Building or maintaining Next.js App Router applications
- Writing server components, client components, or server actions
- Implementing data fetching patterns (SSR, ISR, caching)
- Using streaming with Suspense and loading states
- Configuring parallel or intercepting routes
- Optimizing metadata, images, fonts, and performance
- Setting up authentication in server-first architecture
- Working with middleware, route handlers, or server functions
- Debugging hydration mismatches or rendering issues

## Core Patterns

### Server vs Client Components
- Server Components are the default — never add `'use client'` unnecessarily
- Use Server Components for data fetching, DB queries, and static content
- Use Client Components only for interactivity (state, effects, event handlers)
- Keep the client boundary as low as possible in the component tree
- Pass server-fetched data as props to client components
- Never import server-only code in client components (will cause build errors)
- Use `server-only` package to enforce server component boundaries

### Data Fetching
- Use `fetch()` directly in server components — Next.js extends it with caching
- Use `cache: 'no-store'` for real-time data, default is cached
- Use `revalidate` option for time-based ISR: `{ next: { revalidate: 3600 } }`
- Use `unstable_cache` from `next/cache` for caching non-fetch operations
- Implement `revalidatePath()` or `revalidateTag()` for on-demand revalidation
- Use `loading.js` for automatic Suspense boundaries during data fetching
- Parallel data fetching: call multiple `fetch()` simultaneously in server components

### Server Actions
- Mark with `'use server'` directive at top of file or function
- Use `<form action={serverAction}>` for native form behavior
- Access cookies and headers inside server actions for auth
- Use `useActionState` for form state management in client components
- Validate inputs with Zod inside server actions — never trust client data
- Handle errors with `error.tsx` boundary or try/catch in the action
- Use `revalidatePath()` after mutations to refresh cached pages
- Keep server actions in a separate `actions/` directory for organization

### Streaming & Suspense
- Use `<Suspense fallback={<Skeleton />}>` for progressive rendering
- Wrap slow data fetches in Suspense to stream content as it loads
- Use `loading.tsx` for route-level streaming indicators
- Implement `error.tsx` for error boundaries at any route level
- Use `template.tsx` for shared layouts that re-render on navigation
- Stream multiple independent data fetches simultaneously

### Routing Patterns
- **Parallel Routes**: Use `@slot` named routes for split views (modals, dashboards)
- **Intercepting Routes**: Use `(.)` prefix to intercept navigation (modal over list)
- **Route Groups**: Use `(groupName)` for organizing without affecting URL structure
- **Catch-all**: Use `[...slug]` for flexible routing, `[[...slug]]` for optional
- Use `generateStaticParams()` for dynamic route pre-rendering
- Use `dynamicParams` export to control 404 behavior for missing params

### Metadata
- Export `metadata` object or `generateMetadata` function from layout/page
- Use `generateMetadata` for dynamic SEO (fetch data in metadata generator)
- Set `robots`, `openGraph`, `twitter`, and `alternates` in metadata objects
- Use `MetadataRoute` for `sitemap.ts`, `robots.ts`, and `manifest.ts`
- Avoid `head.tsx` — use metadata API instead
- Use `template` in metadata for consistent title formatting across pages

### Image & Font Optimization
- Use `next/image` with priority for above-the-fold images
- Set `sizes` prop for responsive image sizing
- Use `fill` prop for background images with `objectFit`
- Use `next/font` for zero-layout-shift font loading
- Define fonts in `layout.tsx` for global application
- Use CSS variables from `next/font` for dynamic theming

## Code Examples

### Server Component with Data Fetching
```tsx
// app/posts/page.tsx
import { Suspense } from 'react'

async function PostList() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 },
  }).then(res => res.json())

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  )
}

export default function PostsPage() {
  return (
    <section>
      <h1>Posts</h1>
      <Suspense fallback={<PostsSkeleton />}>
        <PostList />
      </Suspense>
    </section>
  )
}
```

### Server Action with Form
```tsx
// app/posts/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const parsed = PostSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  await db.post.create({ data: parsed.data })
  revalidatePath('/posts')
  return { success: true }
}
```

### Client Form with Server Action
```tsx
'use client'

import { useActionState } from 'react'
import { createPost } from './actions'

export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null)

  return (
    <form action={action}>
      <input name="title" required />
      <textarea name="body" required />
      {state?.error && (
        <div className="text-red-500">
          {Object.values(state.error).flat().join(', ')}
        </div>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

### Parallel Routes (Modal Pattern)
```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <div>
      {children}
      {modal}
    </div>
  )
}

// app/@modal/(.)posts/[id]/page.tsx
export default function InterceptedPostPage({ params }) {
  return (
    <Modal>
      <PostDetail id={params.id} />
    </Modal>
  )
}
```

### Dynamic Metadata
```tsx
// app/posts/[id]/page.tsx
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await fetch(`https://api.example.com/posts/${id}`).then(r => r.json())

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  }
}
```

## Best Practices
- Default to server components — only add `'use client'` when interactivity is needed
- Keep the client boundary as deep as possible in the tree
- Use `loading.tsx` for every route that does async data fetching
- Always implement `error.tsx` boundaries for graceful error recovery
- Use `revalidatePath()` or `revalidateTag()` after mutations
- Validate all server action inputs with Zod — never trust client data
- Use `next/image` for all images — never raw `<img>` tags
- Use `next/font` for all fonts — never load fonts via CSS `@import`
- Avoid `'use client'` in layout files when possible
- Use Route Groups `(groupName)` to organize features without affecting URLs
- Cache expensive computations with `unstable_cache` when `fetch()` isn't appropriate
- Test with `next dev` first — production builds surface different issues
