import { createClient } from '@supabase/supabase-js'

// Next.js caches server-side fetch() by default, and supabase-js uses fetch, so
// without this a match could read as "upcoming" long after it went live.
// Caching is done explicitly at the CDN instead (see /api/match Cache-Control).
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' })

// Service role client for server-side operations (bypasses RLS)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: noStoreFetch },
    }
  )
}

// Anon client for reading public data
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: noStoreFetch } }
  )
}
