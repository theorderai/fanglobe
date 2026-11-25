import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { getSide, setSide } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'
import { SIDES, type Side } from '@/types'

export const runtime = 'nodejs'

/** Pick (or change) which side you're on for a match. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error) return error

  const { matchId, side } = await req.json().catch(() => ({}))
  if (typeof matchId !== 'string' || !SIDES.includes(side)) {
    return NextResponse.json({ error: 'matchId and side (home|away|neutral) required' }, { status: 400 })
  }

  // Side is locked once picked, so fans can't switch to skew the "even X% of <team> fans" stat.
  const existing = await getSide(matchId, user.id)
  if (existing && existing !== side) {
    return NextResponse.json({ error: 'Side already locked for this match', side: existing }, { status: 409 })
  }
  if (existing) return NextResponse.json({ ok: true, side: existing })

  const supabase = createServiceClient()
  const { error: dbError } = await supabase
    .from('match_sides')
    .upsert({ match_id: matchId, user_id: user.id, side: side as Side }, { onConflict: 'match_id,user_id' })
  if (dbError) {
    console.error('side upsert failed:', dbError)
    return NextResponse.json({ error: 'Could not save side' }, { status: 500 })
  }
  await setSide(matchId, user.id, side)
  return NextResponse.json({ ok: true, side })
}
