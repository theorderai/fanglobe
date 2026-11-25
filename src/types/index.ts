// ── Fan Verdict domain types ────────────────────────────────────────────────

export type Side = 'home' | 'away' | 'neutral'
export type Verdict = 'right' | 'wrong'
export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed'
export type IncidentKind =
  | 'penalty' | 'red_card' | 'goal' | 'offside' | 'handball' | 'foul' | 'var_review' | 'other'
export type IncidentSource = 'feed' | 'admin' | 'crowd'
export type IncidentStatus = 'open' | 'closed' | 'hidden'

export const SIDES: Side[] = ['home', 'away', 'neutral']
export const INCIDENT_KINDS: IncidentKind[] = [
  'penalty', 'red_card', 'goal', 'offside', 'handball', 'foul', 'var_review', 'other',
]

export const KIND_LABEL: Record<IncidentKind, string> = {
  penalty: 'Penalty',
  red_card: 'Red card',
  goal: 'Goal decision',
  offside: 'Offside',
  handball: 'Handball',
  foul: 'Foul',
  var_review: 'VAR review',
  other: 'Flashpoint',
}

export const KIND_EMOJI: Record<IncidentKind, string> = {
  penalty: '🎯',
  red_card: '🟥',
  goal: '⚽',
  offside: '🚩',
  handball: '✋',
  foul: '🦵',
  var_review: '📺',
  other: '⚡',
}

export interface Match {
  id: string
  providerId: string | null
  sportId: string
  competition: string | null
  homeTeam: string
  awayTeam: string
  homeShort: string | null
  awayShort: string | null
  homeColor: string | null
  awayColor: string | null
  homeLogo: string | null
  awayLogo: string | null
  venue: string | null
  kickoffAt: string
  status: MatchStatus
  minute: number | null
  homeScore: number | null
  awayScore: number | null
}

export interface Incident {
  id: string
  shortId: string
  matchId: string
  minute: number | null
  kind: IncidentKind
  title: string
  refCall: string
  favouredSide: 'home' | 'away' | null
  source: IncidentSource
  status: IncidentStatus
  createdAt: string
}

export interface SideTally { right: number; wrong: number; angerSum: number }
export type Tally = Record<Side, SideTally>

export interface SideSummary { n: number; wrongPct: number }

export interface VerdictSummary {
  total: number
  wrongPct: number
  avgAnger: number          // 1–5, 0 when no votes
  home: SideSummary
  away: SideSummary
  neutral: SideSummary
  index: number             // controversy index 0–100
  label: 'Fair call' | 'Debatable' | 'Controversial' | 'Robbery' | 'Too early'
  headline: string
  early: boolean            // too few votes to call it
}

export interface IncidentWithSummary extends Incident { summary: VerdictSummary }

export interface Vent {
  id: string
  incidentId: string | null
  side: Side
  text: string
  createdAt: string
}

export interface TapSeries {
  bucketSec: number
  start: string             // ISO time of the first bucket
  counts: number[]
}

export interface MatchFeed {
  match: Match
  incidents: IncidentWithSummary[]
  taps: TapSeries
  vents: Vent[]
  updatedAt: string
}

// ── Profiles (unchanged from the original app) ─────────────────────────────

export interface UserProfile {
  id: string
  display_name: string | null
  favourite_team: string | null
  country: string | null
  country_flag: string | null
  email: string | null
  email_updates: boolean
  avatar_seed: string | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
}
