import type { Match } from '@/types'

export function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function kickoffLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

export function scoreOrTime(m: Match): string {
  if (m.status === 'upcoming' || m.homeScore == null || m.awayScore == null) return kickoffLabel(m.kickoffAt)
  return `${m.homeScore} – ${m.awayScore}`
}

export function teamColor(m: Match, side: 'home' | 'away'): string {
  return (side === 'home' ? m.homeColor : m.awayColor) ?? (side === 'home' ? 'var(--home)' : 'var(--away)')
}

export const LABEL_COLOR: Record<string, string> = {
  'Robbery': '#ff5a5f',
  'Controversial': '#ff9f1c',
  'Debatable': '#ffd166',
  'Fair call': '#39ff76',
  'Too early': '#9aa4b2',
}
