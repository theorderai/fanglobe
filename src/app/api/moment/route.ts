import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { incrMomentReaction, checkRateLimit } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth(req)
  if (authError) return authError

  const body = await req.json()
  const { eventId, type, label, minute, sportId } = body

  if (!eventId || !type || !label || !sportId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Rate limit: 3 moment taps per user per event per hour
  const allowed = await checkRateLimit(`user:${user.id}:${eventId}`, 'moment', 30, 3600)
  if (!allowed) {
    return NextResponse.json({ error: 'Slow down!' }, { status: 429 })
  }

  const supabase = createServiceClient()

  // Find or create moment record for this event+type+minute
  const { data: existing } = await supabase
    .from('moments')
    .select('id, reaction_count')
    .eq('event_id', eventId)
    .eq('type', type)
    .gte('created_at', new Date(Date.now() - 120_000).toISOString()) // within last 2 min
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let momentId: string
  let reactionCount: number

  if (existing) {
    momentId = existing.id
    // Increment in DB
    await supabase.from('moments')
      .update({ reaction_count: existing.reaction_count + 1 })
      .eq('id', momentId)
    reactionCount = existing.reaction_count + 1
  } else {
    const { data: newMoment } = await supabase.from('moments').insert({
      event_id: eventId,
      sport_id: sportId,
      type, label,
      minute: minute ?? null,
      reaction_count: 1,
    }).select('id').single()
    momentId = newMoment?.id ?? 'unknown'
    reactionCount = 1
  }

  // Redis for realtime count
  await incrMomentReaction(momentId)

  return NextResponse.json({ success: true, momentId, reactionCount })
}
