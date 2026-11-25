import type { Match, VerdictSummary } from '@/types'
import { LABEL_COLOR, teamColor } from '@/lib/format'

/** Headline + per-side "% wrong" bars. Pure, so it renders on server and client. */
export default function VerdictSplit({ summary, match, compact = false }: {
  summary: VerdictSummary; match: Match; compact?: boolean
}) {
  const rows = [
    { key: 'home', name: match.homeShort ?? match.homeTeam, s: summary.home, color: teamColor(match, 'home') },
    { key: 'neutral', name: 'Neutrals', s: summary.neutral, color: 'var(--neutral)' },
    { key: 'away', name: match.awayShort ?? match.awayTeam, s: summary.away, color: teamColor(match, 'away') },
  ]

  return (
    <div className="stack" style={{ gap: compact ? 10 : 14 }}>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <span className="label-chip" style={{ background: LABEL_COLOR[summary.label] }}>{summary.label}</span>
        <span className="subtle mono" style={{ fontSize: 12 }}>
          {summary.total.toLocaleString()} verdicts
          {summary.total > 0 && <> · anger {summary.avgAnger}/5</>}
        </span>
      </div>
      <div className="headline" style={compact ? { fontSize: 16 } : undefined}>{summary.headline}</div>
      <div className="split" aria-label="Share of each group saying the referee got it wrong">
        {rows.map(r => (
          <div className="split-row" key={r.key}>
            <span className="name">{r.name}</span>
            <span className="bar"><span style={{ width: `${r.s.n ? r.s.wrongPct : 0}%`, background: r.color }} /></span>
            <span className="val">{r.s.n ? `${r.s.wrongPct}% wrong` : 'no votes'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
