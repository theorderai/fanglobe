import type { Incident, Match } from '@/types'

// Row mappers shared by server code and the Ref Desk (no server-only imports here).
export type Row = Record<string, any>

export function toMatch(r: Row): Match {
  return {
    id: r.id,
    providerId: r.provider_id ?? null,
    sportId: r.sport_id ?? 'soccer',
    competition: r.competition ?? null,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeShort: r.home_short ?? null,
    awayShort: r.away_short ?? null,
    homeColor: r.home_color ?? null,
    awayColor: r.away_color ?? null,
    homeLogo: r.home_logo ?? null,
    awayLogo: r.away_logo ?? null,
    venue: r.venue ?? null,
    kickoffAt: r.kickoff_at,
    status: r.status,
    minute: r.minute ?? null,
    homeScore: r.home_score ?? null,
    awayScore: r.away_score ?? null,
  }
}

export function toIncident(r: Row): Incident {
  return {
    id: r.id,
    shortId: r.short_id,
    matchId: r.match_id,
    minute: r.minute ?? null,
    kind: r.kind,
    title: r.title,
    refCall: r.ref_call,
    favouredSide: r.favoured_side ?? null,
    source: r.source,
    status: r.status,
    createdAt: r.created_at,
  }
}
