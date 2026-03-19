import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Extract and verify Supabase JWT from Authorization header
// Returns the authenticated user or null
export async function getAuthUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token) return null

  // Use anon client to verify the JWT (it validates against Supabase's JWT secret)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Require auth — returns 401 if no valid user
export async function requireAuth(req: NextRequest): Promise<
  { user: User; error: null } | { user: null; error: NextResponse }
> {
  const user = await getAuthUser(req)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 }),
    }
  }
  return { user, error: null }
}

// Extract real IP address from request (Vercel sets x-real-ip)
export function getRealIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

// Hash IP for storage (GDPR-compliant — we never store raw IPs)
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? 'kickoff2026'
  const data = new TextEncoder().encode(ip + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
