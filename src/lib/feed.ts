/**
 * API-Football (v3) adapter: fixtures, live status and match events.
 *
 * Optional. With no API_FOOTBALL_KEY the app runs on matches and incidents
 * created by hand in the Ref Desk (/admin) plus crowd-detected flashpoints.
 *
 * Request budget: the live poll is one request per cron run (every minute =
 * 1,440/day) plus one fixtures request per hour, so this needs a paid plan.
 */
import { createServiceClient } from './supabase-server'
import { createIncident } from './db'
import type { IncidentKind, MatchStatus } from '@/types'

const BASE = 'https://v3.football.api-sports.io'

export function feedEnabled() {
  return Boolean(process.env.API_FOOTBALL_KEY)
}

/** League ids to follow, e.g. "39" = Premier League, "2" = Champions League. */
function leagues(): string[] {
  return (process.env.FEED_LEAGUES ?? '39').split(',').map(s => s.trim()).filter(Boolean)
}

async function get<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API-Football ${path} → ${res.status}`)
  const body = await res.json() as { response?: T[]; errors?: unknown }
  return body.response ?? []
}

interface AfFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null }; venue?: { name?: string | null; city?: string | null } }
  league: { id: number; name: string }
  teams: { home: { id: number; name: string; logo?: string }; away: { id: number; name: string; logo?: string } }
  goals: { home: number | null; away: number | null }
  events?: AfEvent[]
}

interface AfEvent {
  time: { elapsed: number | null; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  type: string    // 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string  // e.g. 'Red Card', 'Penalty', 'Missed Penalty', 'Goal cancelled', 'Penalty confirmed'
}

function mapStatus(short: string): MatchStatus {
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'].includes(short)) return 'live'
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short)) return 'finished'
  if (['PST', 'CANC', 'ABD'].includes(short)) return 'postponed'
  return 'upcoming'
}

function slug(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 24)
}

function short(name: string) {
  return name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase()
    || name.slice(0, 3).toUpperCase()
}

function matchRow(f: AfFixture) {
  return {
    id: `af-${f.fixture.id}-${slug(f.teams.home.name)}-${slug(f.teams.away.name)}`,
    provider_id: String(f.fixture.id),
    sport_id: 'soccer',
    competition: f.league.name,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_short: short(f.teams.home.name),
    away_short: short(f.teams.away.name),
    home_logo: f.teams.home.logo ?? null,
    away_logo: f.teams.away.logo ?? null,
    venue: [f.fixture.venue?.name, f.fixture.venue?.city].filter(Boolean).join(', ') || null,
    kickoff_at: f.fixture.date,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed,
    home_score: f.goals.home,
    away_score: f.goals.away,
    updated_at: new Date().toISOString(),
  }
}

/** Upsert fixtures for today and the next two days. */
export async function syncFixtures(): Promise<number> {
  const supabase = createServiceClient()
  const season = process.env.FEED_SEASON ?? String(new Date().getUTCFullYear())
  let count = 0
  for (let d = 0; d < 3; d++) {
    const date = new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10)
    for (const league of leagues()) {
      const fixtures = await get<AfFixture>(`/fixtures?date=${date}&league=${league}&season=${season}`)
      if (!fixtures.length) continue
      const rows = fixtures.map(matchRow)
      // Don't overwrite the stable id on re-sync: conflict on provider_id.
      const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'provider_id' })
      if (error) console.error('syncFixtures upsert failed:', error)
      else count += rows.length
    }
  }
  return count
}

/** Turn a feed event into an incident worth a fan verdict, or null to ignore it. */
function incidentFromEvent(ev: AfEvent, homeTeamId: number): {
  kind: IncidentKind; title: string; refCall: string; favouredSide: 'home' | 'away' | null
} | null {
  const side: 'home' | 'away' = ev.team.id === homeTeamId ? 'home' : 'away'
  const other: 'home' | 'away' = side === 'home' ? 'away' : 'home'
  const who = ev.player.name ?? ev.team.name
  const detail = ev.detail.toLowerCase()

  if (ev.type === 'Card' && (detail.includes('red') || detail.includes('second yellow'))) {
    return {
      kind: 'red_card',
      title: `${ev.detail}: ${who} (${ev.team.name})`,
      refCall: `${who} sent off`,
      favouredSide: other, // a red card against a team helps their opponent
    }
  }
  if (ev.type === 'Goal' && detail === 'penalty') {
    return { kind: 'penalty', title: `Penalty to ${ev.team.name}, scored by ${who}`, refCall: `Penalty given to ${ev.team.name}`, favouredSide: side }
  }
  if (ev.type === 'Goal' && detail === 'missed penalty') {
    return { kind: 'penalty', title: `Penalty to ${ev.team.name}, missed by ${who}`, refCall: `Penalty given to ${ev.team.name}`, favouredSide: side }
  }
  if (ev.type === 'Var') {
    // The feed doesn't say reliably which side a VAR call helped, so no favoured side.
    return { kind: 'var_review', title: `VAR: ${ev.detail} (${ev.team.name})`, refCall: ev.detail, favouredSide: null }
  }
  return null
}

/** Poll live fixtures: update score/minute and open incidents for new key events. */
export async function syncLive(): Promise<{ live: number; incidents: number }> {
  const supabase = createServiceClient()
  const fixtures = await get<AfFixture>(`/fixtures?live=${leagues().join('-')}`)
  let incidents = 0

  for (const f of fixtures) {
    const row = matchRow(f)
    const { data: saved, error } = await supabase
      .from('matches')
      .upsert(row, { onConflict: 'provider_id' })
      .select('id')
      .single()
    if (error || !saved) { console.error('syncLive upsert failed:', error); continue }

    for (const ev of f.events ?? []) {
      const inc = incidentFromEvent(ev, f.teams.home.id)
      if (!inc) continue
      const minute = ev.time.elapsed != null ? ev.time.elapsed + (ev.time.extra ?? 0) : null
      const providerKey = `af:${f.fixture.id}:${ev.type}:${ev.detail}:${ev.time.elapsed}:${ev.time.extra ?? 0}:${ev.player.id ?? ev.team.id}`
      const created = await createIncident({
        matchId: saved.id, ...inc, minute, source: 'feed', providerKey,
      })
      if (created) incidents++
    }
  }

  return { live: fixtures.length, incidents }
}
