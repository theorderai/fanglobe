import type { IncidentWithSummary, TapSeries } from '@/types'

const W = 600
const H = 88

/**
 * "Bad call!" taps per 10 seconds over the last 30 minutes, with incident
 * markers. This is the live timeseries behind crowd flashpoint detection.
 */
export default function TapTimeline({ taps, incidents }: { taps: TapSeries; incidents: IncidentWithSummary[] }) {
  const n = taps.counts.length
  if (!n) return null
  const max = Math.max(5, ...taps.counts)
  const step = W / n
  const startMs = new Date(taps.start).getTime()
  const spanMs = n * taps.bucketSec * 1000
  const total = taps.counts.reduce((a, b) => a + b, 0)

  const markers = incidents
    .map(i => ({ i, x: ((new Date(i.createdAt).getTime() - startMs) / spanMs) * W }))
    .filter(m => m.x >= 0 && m.x <= W)

  return (
    <div className="timeline card" style={{ padding: '12px 14px' }}>
      <div className="spread" style={{ marginBottom: 6 }}>
        <span className="eyebrow">Fan outrage · last 30 min</span>
        <span className="subtle mono" style={{ fontSize: 12 }}>{total.toLocaleString()} taps</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Bad call taps over the last 30 minutes, ${total} in total`}>
        {taps.counts.map((c, idx) => {
          const h = c ? Math.max(2, (c / max) * (H - 8)) : 0
          return <rect key={idx} x={idx * step + 0.5} y={H - h} width={Math.max(1, step - 1)} height={h} rx={1}
            fill="var(--wrong)" opacity={0.85} />
        })}
        {markers.map(({ i, x }) => (
          <g key={i.id}>
            <line x1={x} x2={x} y1={0} y2={H} stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={x} cy={5} r={4} fill="var(--warn)"><title>{i.title}</title></circle>
          </g>
        ))}
        <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--line-strong)" />
      </svg>
      <div className="spread subtle mono" style={{ fontSize: 11, marginTop: 4 }}>
        <span>-30m</span><span>now</span>
      </div>
    </div>
  )
}
