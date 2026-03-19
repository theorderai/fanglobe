import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { castPulseVote, checkRateLimit } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'edge'

const VALID_VIBES = ['fire', 'ecstatic', 'nervous', 'crushed', 'moment']

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(req)
    if (authError) return authError

    const body: { matchId: string; vibe: string; prevVibe?: string } = await req.json()
    const { matchId, vibe, prevVibe } = body

    if (!matchId || !vibe) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!VALID_VIBES.includes(vibe)) return NextResponse.json({ error: 'Invalid vibe' }, { status: 400 })
    if (prevVibe && !VALID_VIBES.includes(prevVibe)) return NextResponse.json({ error: 'Invalid prev vibe' }, { status: 400 })

    const allowed = await checkRateLimit(`user:${user.id}:${matchId}`, 'vote', 10, 3600)
    if (!allowed) return NextResponse.json({ error: 'Too many vote changes' }, { status: 429 })

    await castPulseVote(matchId, vibe, prevVibe)

    const supabase = createServiceClient()
    void supabase.from('pulse_votes').upsert(
      { match_id: matchId, session_id: user.id, user_id: user.id, vibe, replaced: prevVibe ?? null },
      { onConflict: 'match_id,session_id' }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
