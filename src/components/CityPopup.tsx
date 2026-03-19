'use client'
import type { CityData, FanGlobeEvent, Cheer } from '@/types'

interface Props {
  city: CityData
  event: FanGlobeEvent
  cheers: Cheer[]
  rank: number
  onClose: () => void
  accentColor: string
}

export default function CityPopup({ city, event, cheers, rank, onClose, accentColor }: Props) {
  const cityCheers = cheers.filter(c => c.city === city.city).slice(0, 3)
  const pct = event.isRivalry
    ? city.homeCount !== undefined
      ? Math.round((city.homeCount / Math.max(1, city.count)) * 100)
      : null
    : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(4,5,8,0.95)',
        border: `1px solid ${accentColor.replace('1)', '0.3)')}`,
        borderRadius: 18, padding: 20, width: 260,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: `0 0 40px ${accentColor.replace('1)', '0.15)')}, 0 24px 60px rgba(0,0,0,0.7)`,
        pointerEvents: 'auto',
        animation: 'fadeInUp 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 28 }}>{city.flag}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>{city.city}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>#{rank} globally</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Fan count */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: accentColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {city.count.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '1px' }}>fans watching</div>
        </div>

        {/* Rivalry split for this city */}
        {pct !== null && event.homeColor && event.awayColor && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: event.homeColor, fontWeight: 700 }}>{event.homeFlag} {pct}%</span>
              <span style={{ fontSize: 11, color: event.awayColor, fontWeight: 700 }}>{100 - pct}% {event.awayFlag}</span>
            </div>
            <div style={{ height: 4, borderRadius: 100, overflow: 'hidden', display: 'flex', gap: 1 }}>
              <div style={{ width: `${pct}%`, background: event.homeColor, borderRadius: 100 }} />
              <div style={{ width: `${100 - pct}%`, background: event.awayColor, borderRadius: 100 }} />
            </div>
          </div>
        )}

        {/* Local cheers */}
        {cityCheers.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
              Local cheers
            </div>
            {cityCheers.map(c => (
              <div key={c.id} style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.4 }}>
                "{c.text}"
              </div>
            ))}
          </div>
        )}

        {cityCheers.length === 0 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
            No cheers from {city.city} yet
          </div>
        )}
      </div>
    </div>
  )
}
