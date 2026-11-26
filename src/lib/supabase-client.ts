'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// NEXT_PUBLIC_* values are inlined at build time. If they're missing (e.g. an
// environment without the variables), fall back to an unreachable host so the
// build still succeeds and the problem shows up as failed requests instead of
// a failed deploy.
const MISSING_URL = 'https://supabase-env-missing.invalid'

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) console.error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set')
    client = createClient(url || MISSING_URL, key || 'missing-anon-key')
  }
  return client
}
