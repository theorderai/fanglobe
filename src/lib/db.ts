import { createServiceClient } from './supabase-server'
import { getTallies, getTapSeries, primeTally, BUCKET_SEC, acquireSpikeLock } from './redis'
import { emptyTally, estimateMinute, summarize } from './verdict'
import { toIncident, toMatch, type Row } from './match-row'
export { toIncident, toMatch }
import type {
  Incident, IncidentKind, IncidentSource, IncidentWithSummary, Match, MatchFeed, Side, Tally, Vent,
} from '@/types'

export async function getMatch(id: string): Promise<Match | null> {
  const { data } = await createServiceClient().from('matches').select('*').eq('id', id).maybeSingle()
  return data ? toMatch(data) : null
}

export async function listMatches(): Promise<{ live: Match[]; upcoming: Match[]; recent: Match[] }> {
  const supabase = createServiceClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString()
  const weekAhead = new Date(now.getTime() + 7 * 86400_000).toISOString()
  const { data } = await supabase
    .from('matches')
    .select('*')
    .gte('kickoff_at', weekAgo)
    .lte('kickoff_at', weekAhead)
    .order('kickoff_at', { ascending: true })
    .limit(200)
  const all = (data ?? []).map(toMatch)
  return {
    live: all.filter(m => m.status === 'live'),
    upcoming: all.filter(m => m.status === 'upcoming'),
    recent: all.filter(m => m.status === 'finished').reverse(),
  }
}

/** Tallies come from Redis; if Redis has lost one, rebuild it from Postgres. */
async function talliesFor(incidents: Incident[]): Promise<Map<string, Tally>> {
  const fromRedis = await getTallies(incidents.map(i => i.id))
  const out = new Map<string, Tally>()
  const supabase = createServiceClient()
  await Promise.all(incidents.map(async inc => {
    const cached = fromRedis.get(inc.id)
    if (cached) { out.set(inc.id, cached); return }
    const { data } = await supabase.rpc('incident_tally', { p_incident_id: inc.id })
    const t = emptyTally()
    for (const row of (data ?? []) as Row[]) {
      const side = row.side as Side
      if (!t[side]) continue
      if (row.verdict === 'right') t[side].right = Number(row.votes)
      if (row.verdict === 'wrong') t[side].wrong = Number(row.votes)
      t[side].angerSum += Number(row.anger_sum ?? 0)
    }
    out.set(inc.id, t)
    if ((data ?? []).length) await primeTally(inc.id, t)
  }))
  return out
}

export async function withSummaries(incidents: Incident[], match: Match): Promise<IncidentWithSummary[]> {
  const tallies = await talliesFor(incidents)
  return incidents.map(inc => ({ ...inc, summary: summarize(tallies.get(inc.id) ?? emptyTally(), inc, match) }))
}

export async function getIncidentByShortId(shortId: string): Promise<{ incident: IncidentWithSummary; match: Match } | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('incidents').select('*').eq('short_id', shortId).neq('status', 'hidden').maybeSingle()
  if (!data) return null
  const incident = toIncident(data)
  const match = await getMatch(incident.matchId)
  if (!match) return null
  const [withSummary] = await withSummaries([incident], match)
  return { incident: withSummary, match }
}

const TAP_WINDOW_BUCKETS = (30 * 60) / BUCKET_SEC // last 30 minutes

export async function buildFeed(matchId: string): Promise<MatchFeed | null> {
  const match = await getMatch(matchId)
  if (!match) return null
  const supabase = createServiceClient()

  const [{ data: incRows }, { data: ventRows }, taps] = await Promise.all([
    supabase.from('incidents').select('*').eq('match_id', matchId).neq('status', 'hidden')
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('vents').select('id, incident_id, side, text, created_at').eq('match_id', matchId)
      .eq('status', 'approved').order('created_at', { ascending: false }).limit(30),
    getTapSeries(matchId, TAP_WINDOW_BUCKETS),
  ])

  const incidents = await withSummaries((incRows ?? []).map(toIncident), match)
  const vents: Vent[] = (ventRows ?? []).map((r: Row) => ({
    id: r.id, incidentId: r.incident_id ?? null, side: r.side, text: r.text, createdAt: r.created_at,
  }))

  return {
    match,
    incidents,
    vents,
    taps: {
      bucketSec: BUCKET_SEC,
      start: new Date(taps.startBucket * BUCKET_SEC * 1000).toISOString(),
      counts: taps.counts,
    },
    updatedAt: new Date().toISOString(),
  }
}

export interface NewIncident {
  matchId: string
  kind: IncidentKind
  title: string
  refCall: string
  minute?: number | null
  favouredSide?: 'home' | 'away' | null
  source: IncidentSource
  providerKey?: string | null
}

/**
 * Create an incident. Feed incidents dedupe on providerKey; every new incident
 * also takes the match's spike lock so the crowd detector doesn't open a
 * duplicate for the same moment.
 */
export async function createIncident(input: NewIncident, match?: Match | null): Promise<Incident | null> {
  const supabase = createServiceClient()
  const m = match ?? await getMatch(input.matchId)
  if (!m) return null
  const minute = input.minute ?? m.minute ?? estimateMinute(m.kickoffAt)

  const row = {
    match_id: input.matchId,
    kind: input.kind,
    title: input.title.slice(0, 120),
    ref_call: input.refCall.slice(0, 120),
    minute,
    favoured_side: input.favouredSide ?? null,
    source: input.source,
    provider_key: input.providerKey ?? null,
  }

  const q = input.providerKey
    ? supabase.from('incidents').upsert(row, { onConflict: 'provider_key', ignoreDuplicates: true }).select('*')
    : supabase.from('incidents').insert(row).select('*')
  const { data, error } = await q
  if (error) { console.error('createIncident failed:', error); return null }
  const created = (data ?? [])[0]
  if (!created) return null // duplicate feed event
  if (input.source !== 'crowd') await acquireSpikeLock(input.matchId)
  return toIncident(created)
}
