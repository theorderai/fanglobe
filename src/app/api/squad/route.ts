import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function generateCode(): string {
  // e.g. "BRZ7K2" — short, readable, shareable
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// POST: create a new squad or join an existing one
export async function POST(req: NextRequest) {
  try {
    const { action, matchId, sessionId, code, name, city, flag, lat, lng, teamSide } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

    const supabase = createServiceClient()

    if (action === 'create') {
      if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
      let newCode = generateCode()
      // Ensure unique
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.from('squads').select('id').eq('code', newCode).single()
        if (!data) break
        newCode = generateCode()
      }
      const { data: squad, error } = await supabase
        .from('squads')
        .insert({ code: newCode, name: name ?? 'Fan Squad', match_id: matchId, created_by: sessionId })
        .select().single()
      if (error) throw error

      // Auto-add creator as first member
      await supabase.from('squad_members').insert({
        squad_id: squad.id, session_id: sessionId, city, flag, lat, lng, team_side: teamSide,
      })

      return NextResponse.json({ ok: true, squad, code: newCode })
    }

    if (action === 'join') {
      if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })
      const { data: squad } = await supabase.from('squads').select('*').eq('code', code.toUpperCase()).single()
      if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 })

      await supabase.from('squad_members').upsert({
        squad_id: squad.id, session_id: sessionId, city, flag, lat, lng, team_side: teamSide,
      }, { onConflict: 'squad_id,session_id' })

      return NextResponse.json({ ok: true, squad })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('squad error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET: fetch squad by code + members
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  try {
    const supabase = createServiceClient()
    const { data: squad } = await supabase.from('squads').select('*').eq('code', code.toUpperCase()).single()
    if (!squad) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: members } = await supabase
      .from('squad_members').select('*').eq('squad_id', squad.id)
      .order('joined_at', { ascending: true })

    return NextResponse.json({
      squad,
      members: members ?? [],
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
