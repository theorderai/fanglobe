import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'
import { createIncident } from '@/lib/db'
import { INCIDENT_KINDS, type IncidentKind } from '@/types'

export const runtime = 'nodejs'

/** 'ok', or why the request was refused. Whitespace is trimmed on both sides,
 *  since a pasted env var or typed secret often picks up a stray space/newline. */
function checkAdmin(req: NextRequest): 'ok' | 'not_configured' | 'wrong_secret' {
  const secret = (process.env.ADMIN_SECRET ?? '').trim()
  const given = (req.headers.get('x-admin-secret') ?? '').trim()
  if (secret.length < 16) return 'not_configured'
  const a = Buffer.from(secret)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b) ? 'ok' : 'wrong_secret'
}

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null
}

/**
 * Ref Desk actions (used by /admin):
 *   create_match     { id, homeTeam, awayTeam, kickoffAt, competition?, homeColor?, awayColor?, venue? }
 *   update_match     { id, status?, minute?, homeScore?, awayScore? }
 *   create_incident  { matchId, kind, title, refCall, minute?, favouredSide? }
 *   set_incident     { id, status: 'open'|'closed'|'hidden', title?, refCall?, kind?, favouredSide? }
 */
export async function POST(req: NextRequest) {
  const auth = checkAdmin(req)
  if (auth === 'not_configured') {
    return NextResponse.json({ error: 'ADMIN_SECRET is not set (or under 16 characters) for this deployment' }, { status: 503 })
  }
  if (auth === 'wrong_secret') {
    return NextResponse.json({ error: 'Wrong admin secret' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const supabase = createServiceClient()

  switch (body.action) {
    case 'create_match': {
      const id = str(body.id, 80)
      const homeTeam = str(body.homeTeam, 60)
      const awayTeam = str(body.awayTeam, 60)
      const kickoff = typeof body.kickoffAt === 'string' ? new Date(body.kickoffAt) : null
      if (!id || !/^[a-z0-9-]+$/.test(id) || !homeTeam || !awayTeam || !kickoff || isNaN(kickoff.getTime())) {
        return NextResponse.json({ error: 'id (a-z0-9-), homeTeam, awayTeam, kickoffAt required' }, { status: 400 })
      }
      const { data, error } = await supabase.from('matches').insert({
        id, home_team: homeTeam, away_team: awayTeam, kickoff_at: kickoff.toISOString(),
        competition: str(body.competition, 60),
        home_short: str(body.homeShort, 5), away_short: str(body.awayShort, 5),
        home_color: str(body.homeColor, 20), away_color: str(body.awayColor, 20),
        venue: str(body.venue, 120),
      }).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true, match: data })
    }

    case 'update_match': {
      const id = str(body.id, 80)
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (['upcoming', 'live', 'finished', 'postponed'].includes(body.status)) patch.status = body.status
      for (const [k, col] of [['minute', 'minute'], ['homeScore', 'home_score'], ['awayScore', 'away_score']] as const) {
        if (body[k] === null || Number.isInteger(body[k])) patch[col] = body[k]
      }
      const { data, error } = await supabase.from('matches').update(patch).eq('id', id).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true, match: data })
    }

    case 'create_incident': {
      const matchId = str(body.matchId, 80)
      const title = str(body.title, 120)
      const refCall = str(body.refCall, 120)
      const kind = INCIDENT_KINDS.includes(body.kind) ? body.kind as IncidentKind : null
      if (!matchId || !title || !refCall || !kind) {
        return NextResponse.json({ error: 'matchId, kind, title, refCall required' }, { status: 400 })
      }
      const incident = await createIncident({
        matchId, kind, title, refCall, source: 'admin',
        minute: Number.isInteger(body.minute) ? body.minute : null,
        favouredSide: body.favouredSide === 'home' || body.favouredSide === 'away' ? body.favouredSide : null,
      })
      if (!incident) return NextResponse.json({ error: 'Could not create incident' }, { status: 400 })
      return NextResponse.json({ ok: true, incident })
    }

    case 'set_incident': {
      const id = str(body.id, 40)
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const patch: Record<string, unknown> = {}
      if (['open', 'closed', 'hidden'].includes(body.status)) {
        patch.status = body.status
        patch.closed_at = body.status === 'open' ? null : new Date().toISOString()
      }
      if (str(body.title, 120)) patch.title = str(body.title, 120)
      if (str(body.refCall, 120)) patch.ref_call = str(body.refCall, 120)
      if (INCIDENT_KINDS.includes(body.kind)) patch.kind = body.kind
      if (body.favouredSide === 'home' || body.favouredSide === 'away' || body.favouredSide === null) {
        patch.favoured_side = body.favouredSide
      }
      const { data, error } = await supabase.from('incidents').update(patch).eq('id', id).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true, incident: data })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
