---
name: supabase-expert
description: Supabase platform. PostgreSQL API, Authentication, Realtime, Storage, Edge Functions.
---

# Supabase Expert

## When to Apply
Use this skill when building or maintaining Supabase applications, including PostgreSQL database design, auto-generated APIs, authentication, realtime subscriptions, storage, and Edge Functions.

## Core Concepts
- **PostgreSQL Database**: Tables, views, functions, triggers, RLS policies, migrations, types
- **Auto-Generated API**: REST and GraphQL APIs from schema, filtering, pagination, ordering
- **Row Level Security (RLS)**: Policy definitions, role-based access, per-user data isolation
- **Authentication**: Email/password, magic links, OAuth providers, MFA, session management
- **Realtime**: Broadcast, presence, database change subscriptions, row-level filtering
- **Storage**: Buckets, file uploads, image transformations, access control policies
- **Edge Functions**: Deno-based serverless functions, webhook handling, scheduled tasks

## Implementation
```sql
-- Database schema with RLS
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles readable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

```typescript
// Supabase client usage
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Query with filtering and pagination
const { data, error } = await supabase
  .from('profiles')
  .select('id, username, full_name, avatar_url')
  .eq('username', targetUsername)
  .single()

// Insert with returning
const { data: profile, error } = await supabase
  .from('profiles')
  .insert({ id: userId, username, full_name: fullName })
  .select()
  .single()

// Realtime subscription
const channel = supabase
  .channel('profile-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
    (payload) => {
      console.log('Profile changed:', payload)
      updateUI(payload.new)
    }
  )
  .subscribe()

// Storage upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    contentType: 'image/png',
    upsert: true
  })

const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)

// Edge Function invocation
const { data, error } = await supabase.functions.invoke('process-order', {
  body: { orderId, action: 'confirm' }
})

// Authentication
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

## Best Practices
- Design RLS policies before writing application code — security first
- Use database functions and triggers for complex business logic close to data
- Create indexes for columns used in RLS policies and frequent queries
- Use `select()` to specify only needed columns — reduce bandwidth
- Use Edge Functions for server-side logic that requires API keys
- Set up realtime only on tables that need it — it's resource-intensive
- Use storage transformations for image resizing instead of client-side processing
- Run migrations with `supabase db push` or `supabase migration up` in CI/CD
