import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'edge'

const MAX_NAME_LEN = 40
const MAX_TEAM_LEN = 60

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth(req)
  if (authError) return authError

  const body = await req.json()
  const { display_name, favourite_team, country, country_flag, email, email_updates } = body

  // Sanitise
  const updates: Record<string, unknown> = { id: user.id }

  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.length > MAX_NAME_LEN) {
      return NextResponse.json({ error: 'Invalid display_name' }, { status: 400 })
    }
    updates.display_name = display_name.trim() || null
  }

  if (favourite_team !== undefined) {
    if (typeof favourite_team !== 'string' || favourite_team.length > MAX_TEAM_LEN) {
      return NextResponse.json({ error: 'Invalid favourite_team' }, { status: 400 })
    }
    updates.favourite_team = favourite_team || null
  }

  if (country !== undefined)      updates.country = typeof country === 'string' ? country : null
  if (country_flag !== undefined) updates.country_flag = typeof country_flag === 'string' ? country_flag : null

  if (email !== undefined) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    updates.email = email || null
    updates.email_updates = Boolean(email_updates)
    updates.is_anonymous = false
  }

  updates.updated_at = new Date().toISOString()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(updates, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Profile upsert error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireAuth(req)
  if (authError) return authError

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ profile: data })
}
