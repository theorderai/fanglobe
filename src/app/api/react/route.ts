import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { acquireSpikeLock, getTapSeries, recordTap } from '@/lib/redis'
import { detectSpike } from '@/lib/spike'
import { createIncident, getMatch } from '@/lib/db'

export const runtime = 'nodejs'

/** How many buckets of history the spike detector compares against (5 minutes). */
const BASELINE_BUCKETS = 30

/**
 * "Bad call!" tap. Feeds the live timeseries; when taps spike well above the
 * match's baseline, a crowd flashpoint incident opens automatically.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error) return error

  const { matchId } = await req.json().catch(() => ({}))
  if (typeof matchId !== 'string') return NextResponse.json({ error: 'matchId required' }, { status: 400 })

  const match = await getMatch(matchId)
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.status !== 'live') return NextResponse.json({ error: 'Match is not live' }, { status: 409 })

  const counted = await recordTap(matchId, user.id)
  if (!counted) return NextResponse.json({ ok: true, counted: false })

  const { counts } = await getTapSeries(matchId, BASELINE_BUCKETS + 1)
  const spike = detectSpike(counts)

  let incidentShortId: string | null = null
  if (spike.spike && await acquireSpikeLock(matchId)) {
    const incident = await createIncident({
      matchId,
      kind: 'other',
      title: 'Fans flagged a decision',
      refCall: 'Was the referee right?',
      source: 'crowd',
    }, match)
    incidentShortId = incident?.shortId ?? null
  }

  return NextResponse.json({ ok: true, counted: true, spike: spike.spike, incidentShortId })
}
