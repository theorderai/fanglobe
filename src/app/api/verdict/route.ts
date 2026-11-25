import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { checkRateLimit, getSide, recordVote } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'
import { getMatch, toIncident, withSummaries } from '@/lib/db'

export const runtime = 'nodejs'

/** Cast a verdict on an incident: right/wrong call plus anger 1–5. One per fan, final. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const { incidentId, verdict } = body
  const anger = Number(body.anger ?? 3)
  if (typeof incidentId !== 'string' || (verdict !== 'right' && verdict !== 'wrong') ||
      !Number.isInteger(anger) || anger < 1 || anger > 5) {
    return NextResponse.json({ error: 'incidentId, verdict (right|wrong), anger (1-5) required' }, { status: 400 })
  }

  if (!await checkRateLimit(user.id, 'verdict', 30, 60)) {
    return NextResponse.json({ error: 'Slow down' }, { status: 429 })
  }

  const supabase = createServiceClient()
  const { data: row } = await supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle()
  if (!row || row.status === 'hidden') return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
  if (row.status !== 'open') return NextResponse.json({ error: 'Voting has closed' }, { status: 409 })

  const incident = toIncident(row)
  const side = (await getSide(incident.matchId, user.id)) ?? 'neutral'

  const counted = await recordVote(incident.id, user.id, side, verdict, anger)
  if (!counted) return NextResponse.json({ error: 'Already voted', code: 'ALREADY_VOTED' }, { status: 409 })

  const { error: dbError } = await supabase.from('verdict_votes').insert({
    incident_id: incident.id, user_id: user.id, side, verdict, anger,
  })
  if (dbError) console.error('verdict insert failed (Redis already counted it):', dbError)

  const match = await getMatch(incident.matchId)
  const [withSummary] = match ? await withSummaries([incident], match) : [null]
  return NextResponse.json({ ok: true, side, incident: withSummary })
}
