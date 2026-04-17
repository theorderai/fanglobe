import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { matchId, sessionId } = await req.json()
    if (!matchId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

    const supabase = createServiceClient()

    // If user has a push subscription, add this matchId to their match_ids
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('endpoint, match_ids')
      .eq('session_id', sessionId)
      .limit(1)
      .single()

    if (sub) {
      const matchIds = new Set([...(sub.match_ids ?? []), matchId])
      await supabase
        .from('push_subscriptions')
        .update({ match_ids: [...matchIds] })
        .eq('endpoint', sub.endpoint)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reminder error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
