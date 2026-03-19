'use client'
import type { FanGlobeEvent, Snapshot } from '@/types'

interface Props {
  event: FanGlobeEvent
  snapshot: Snapshot
}

export default function RivalrySplit({ event, snapshot }: Props) {
  if (!event.isRivalry) return null

  const total = Math.max(1, snapshot.homeCount + snapshot.awayCount)
  const homePct = Math.round((snapshot.homeCount / total) * 100)
  const awayPct = 100 - homePct

  const homeColor = event.homeColor ?? '#39ff76'
  const awayColor = event.awayColor ?? '#00d4ff'

  const fmtCount = (n: number) => n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)

  return (
    <div style={{
      position: 'fixed', top: 'var(--split-top, 90px)', left: '50%', transform: 'translateX(-50%)',
      zIndex: 18, width: 'min(340px, 82vw)',
      background: 'rgba(6,7,10,0.82)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 16, padding: '12px 16px',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      {/* Title */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
          Fan split
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
          {fmtCount(total)} fans
        </div>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{event.homeFlag}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: homeColor }}>{homePct}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{event.homeTeam}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: awayColor }}>{awayPct}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{event.awayTeam}</div>
          </div>
          <span style={{ fontSize: 16 }}>{event.awayFlag}</span>
        </div>
      </div>

      {/* Split bar */}
      <div style={{ height: 6, borderRadius: 100, overflow: 'hidden', display: 'flex', gap: 1 }}>
        <div style={{
          width: `${homePct}%`, height: '100%', borderRadius: '100px 0 0 100px',
          background: homeColor, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
        <div style={{
          width: `${awayPct}%`, height: '100%', borderRadius: '0 100px 100px 0',
          background: awayColor, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  )
}
