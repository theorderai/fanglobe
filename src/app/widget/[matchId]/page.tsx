'use client'
import { useState, useEffect, use } from 'react'

interface WidgetData {
  totalCount: number
  countryCount: number
  cities: { city: string; flag: string; count: number }[]
  pulse: Record<string, number>
  fas?: { score: number; label: string; color: string }
  event?: { homeTeam: string; awayTeam: string; homeFlag: string; awayFlag: string }
}

const VIBES = [
  { key: 'fire',     label: 'Pumped',   color: '#ff6b35' },
  { key: 'ecstatic', label: 'Ecstatic', color: '#ffd166' },
  { key: 'nervous',  label: 'Nervous',  color: '#a78bfa' },
  { key: 'crushed',  label: 'Gutted',   color: '#60a5fa' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

export default function WidgetPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const [data, setData] = useState<WidgetData | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/snapshot/${matchId}`, { cache: 'no-store' })
        const json = await res.json()
        setData(json)
      } catch {}
    }
    load()
    const interval = setInterval(() => { load(); setTick(t => t + 1) }, 30000)
    return () => clearInterval(interval)
  }, [matchId])

  const accent = data?.fas?.color ?? '#39FF76'
  const total = data?.totalCount ?? 0
  const pulse = data?.pulse ?? { fire: 0, ecstatic: 0, nervous: 0, crushed: 0, moment: 0 }
  const totalVotes = Math.max(1, VIBES.reduce((s, v) => s + (pulse[v.key] ?? 0), 0))
  const topCities = data?.cities?.slice(0, 3) ?? []

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: '#04050a',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex', flexDirection: 'column', padding: 12,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>
          fanglobe<span style={{ color: accent }}>.live</span>
        </div>
        {data?.fas && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>FAS</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: accent, lineHeight: 1 }}>{data.fas.score}</span>
            <span style={{ fontSize: 9, color: accent, letterSpacing: '0.5px' }}>{data.fas.label.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Fan count */}
      <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1, textShadow: `0 0 30px ${accent}44` }}>
          {fmt(total)}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 3 }}>
          fans watching globally
        </div>
      </div>

      {/* Emotion bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 6, borderRadius: 100, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', gap: 1 }}>
          {VIBES.map(v => {
            const pct = ((pulse[v.key] ?? 0) / totalVotes) * 100
            return pct > 0 ? (
              <div key={v.key} style={{ width: `${pct}%`, height: '100%', background: v.color, borderRadius: 100, transition: 'width 0.8s ease' }} />
            ) : null
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {VIBES.map(v => {
            const pct = Math.round(((pulse[v.key] ?? 0) / totalVotes) * 100)
            if (!pct) return null
            return (
              <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: v.color }}>{pct}%</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{v.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />

      {/* Top cities */}
      {topCities.length > 0 && (
        <div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Top cities</div>
          {topCities.map((c, i) => (
            <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: ['#FFD166','rgba(200,200,200,0.5)','rgba(180,130,80,0.6)'][i], minWidth: 12 }}>{i+1}</span>
              <span style={{ fontSize: 12 }}>{c.flag}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{c.city}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{fmt(c.count)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>{data?.countryCount ?? 0} countries · live</span>
        <a href="https://fanglobe.live" target="_blank" style={{ fontSize: 8, color: accent, textDecoration: 'none', opacity: 0.6 }}>fanglobe.live ↗</a>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #04050a; }
      `}</style>
    </div>
  )
}