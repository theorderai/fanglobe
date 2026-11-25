import type { Incident, Match, Side, SideSummary, Tally, VerdictSummary } from '@/types'

/** Below this many votes we show results but don't label the call. */
export const MIN_VOTES = 25
/** A side needs this many votes before we quote it in a headline. */
export const MIN_SIDE_VOTES = 10

export function emptyTally(): Tally {
  return {
    home: { right: 0, wrong: 0, angerSum: 0 },
    away: { right: 0, wrong: 0, angerSum: 0 },
    neutral: { right: 0, wrong: 0, angerSum: 0 },
  }
}

function sideSummary(t: Tally, side: Side): SideSummary {
  const n = t[side].right + t[side].wrong
  return { n, wrongPct: n ? Math.round((t[side].wrong / n) * 100) : 0 }
}

function teamName(match: Pick<Match, 'homeTeam' | 'awayTeam'>, side: 'home' | 'away') {
  return side === 'home' ? match.homeTeam : match.awayTeam
}

/**
 * Turn raw vote counts into what fans and broadcasters see.
 *
 * Controversy index (0–100):
 *   60% dissent  — share saying the ref got it wrong (neutrals if we have enough of them)
 *   25% anger    — average anger, scaled from 1–5 to 0–1
 *   15% volume   — log scale, 10k votes maxes it out
 *
 * Neutrals are preferred because partisan fans almost always side with their team;
 * a neutral majority is the number that is hard to dismiss.
 */
export function summarize(
  tally: Tally,
  incident: Pick<Incident, 'favouredSide'>,
  match: Pick<Match, 'homeTeam' | 'awayTeam'>,
): VerdictSummary {
  const home = sideSummary(tally, 'home')
  const away = sideSummary(tally, 'away')
  const neutral = sideSummary(tally, 'neutral')

  const total = home.n + away.n + neutral.n
  const wrong = tally.home.wrong + tally.away.wrong + tally.neutral.wrong
  const angerSum = tally.home.angerSum + tally.away.angerSum + tally.neutral.angerSum
  const wrongPct = total ? Math.round((wrong / total) * 100) : 0
  const avgAnger = total ? Math.round((angerSum / total) * 10) / 10 : 0

  const dissent = neutral.n >= MIN_SIDE_VOTES ? neutral.wrongPct / 100 : wrongPct / 100
  const angerNorm = total ? (avgAnger - 1) / 4 : 0
  const volume = Math.min(1, Math.log10(total + 1) / 4)
  const index = total ? Math.round(100 * (0.6 * dissent + 0.25 * angerNorm + 0.15 * volume)) : 0

  const early = total < MIN_VOTES
  let label: VerdictSummary['label']
  if (early) label = 'Too early'
  else if (index >= 75) label = 'Robbery'
  else if (index >= 55) label = 'Controversial'
  else if (index >= 35) label = 'Debatable'
  else label = 'Fair call'

  return {
    total, wrongPct, avgAnger, home, away, neutral, index, label, early,
    headline: headline({ home, away, neutral, total, wrongPct }, incident, match),
  }
}

function headline(
  s: { home: SideSummary; away: SideSummary; neutral: SideSummary; total: number; wrongPct: number },
  incident: Pick<Incident, 'favouredSide'>,
  match: Pick<Match, 'homeTeam' | 'awayTeam'>,
): string {
  if (s.total === 0) return 'No verdicts yet. Be the first to call it.'

  // The quote pundits read out: fans of the team that BENEFITED saying the ref was wrong.
  const fav = incident.favouredSide
  if (fav) {
    const favSide = s[fav]
    if (favSide.n >= MIN_SIDE_VOTES && favSide.wrongPct >= 30) {
      return `Even ${favSide.wrongPct}% of ${teamName(match, fav)} fans say the ref got it wrong`
    }
  }

  if (s.neutral.n >= MIN_SIDE_VOTES) {
    return s.neutral.wrongPct >= 50
      ? `${s.neutral.wrongPct}% of neutral fans say the ref got it wrong`
      : `${100 - s.neutral.wrongPct}% of neutral fans back the ref`
  }

  return s.wrongPct >= 50
    ? `${s.wrongPct}% of fans say the ref got it wrong`
    : `${100 - s.wrongPct}% of fans back the ref`
}

/**
 * Rough match minute from kickoff time, used when no live feed is giving us one.
 * Assumes a 15-minute half-time break and ignores stoppage time.
 */
export function estimateMinute(kickoffAt: string, now = Date.now()): number | null {
  const elapsed = Math.floor((now - new Date(kickoffAt).getTime()) / 60_000)
  if (elapsed < 0) return null
  if (elapsed <= 47) return Math.max(1, elapsed)
  if (elapsed < 62) return 45
  return Math.min(120, elapsed - 15)
}
