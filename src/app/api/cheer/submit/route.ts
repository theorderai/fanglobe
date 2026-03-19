import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'
import { moderateCheer } from '@/lib/claude'

export const runtime = 'nodejs'

const VALID_VIBES = ['fire', 'ecstatic', 'nervous', 'crushed', 'moment']

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(req)
    if (authError) return authError

    const body = await req.json()
    const { matchId, text, vibe, city, flag } = body

    if (!matchId || !text) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    if (text.length > 160) return NextResponse.json({ error: 'Cheer too long' }, { status: 400 })
    if (vibe && !VALID_VIBES.includes(vibe)) return NextResponse.json({ error: 'Invalid vibe' }, { status: 400 })

    const allowed = await checkRateLimit(`user:${user.id}:${matchId}`, 'cheer', 3, 3600)
    if (!allowed) return NextResponse.json({ error: 'Too many cheers' }, { status: 429 })

    const modResult = await moderateCheer(text)
    if (!modResult.approved) return NextResponse.json({ error: 'Cheer not approved', reason: modResult.reason }, { status: 422 })

    const finalText = modResult.cleaned ?? text
    const shouldDisplay = Math.random() < 0.2

    const supabase = createServiceClient()
    await supabase.from('cheers').insert({
      match_id: matchId,
      event_id: matchId,
      city: city ?? 'Somewhere',
      flag: flag ?? '🌍',
      text: finalText,
      vibe: vibe ?? null,
      source: 'user',
      session_id: user.id,
      user_id: user.id,
      moderated: shouldDisplay,
    })

    return NextResponse.json({ success: true, displayed: shouldDisplay })
  } catch (err) {
    console.error('Cheer submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
