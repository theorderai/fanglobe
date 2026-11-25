import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { checkRateLimit, getSide } from '@/lib/redis'
import { moderateVent } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/** Post a short vent. Only shown publicly if moderation approves it. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error) return error

  const { matchId, incidentId, text } = await req.json().catch(() => ({}))
  const clean = typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : ''
  if (typeof matchId !== 'string' || !clean || clean.length > 200) {
    return NextResponse.json({ error: 'matchId and text (1-200 chars) required' }, { status: 400 })
  }
  if (!await checkRateLimit(user.id, 'vent', 1, 30)) {
    return NextResponse.json({ error: 'One vent every 30 seconds' }, { status: 429 })
  }

  const side = (await getSide(matchId, user.id)) ?? 'neutral'
  const mod = await moderateVent(clean)

  const supabase = createServiceClient()
  const { error: dbError } = await supabase.from('vents').insert({
    match_id: matchId,
    incident_id: typeof incidentId === 'string' ? incidentId : null,
    user_id: user.id,
    side,
    text: clean,
    status: mod.approved ? 'approved' : 'rejected',
  })
  if (dbError) {
    console.error('vent insert failed:', dbError)
    return NextResponse.json({ error: 'Could not post' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, approved: mod.approved, reason: mod.approved ? null : mod.reason })
}
