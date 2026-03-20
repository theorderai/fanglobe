'use client'
import { useState, useEffect } from 'react'

interface City { rank: number; city: string; country: string; flag: string; count: number; home: number; away: number }
interface Event { id: string; slug: string; homeTeam: string; awayTeam: string; homeFlag: string; awayFlag: string; kickoffAt: string }
interface FAS { score: number; label: string; color: string }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}K`
  return String(n)
}

const RANK_STYLE = [
  { bg: '#FFD166', color: '#412402' },
  { bg: 'rgba(200,200,200,0.2)', color: 'rgba(255,255,255,0.7)' },
  { bg: 'rgba(180,130,80,0.25)', color: 'rgba(200,150,80,0.9)' },
]

export default function LeaderboardPage() {
  const [data, setData] = useState<{ cities: City[]; totalFans: number; countryCount: number; fas: FAS | null; event: Event | null; events: Event[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const match = params.get('match')
    if (match) setSelectedMatch(match)
    fetchData(match)
  }, [])

  const fetchData = async (match: string | null) => {
    setLoading(true)
    try {
      const url = `/api/leaderboard${match ? `?match=${match}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch {}
    finally { setLoading(false) }
  }

  const switchMatch = (slug: string) => {
    setSelectedMatch(slug)
    window.history.replaceState(null, '', `/leaderboard?match=${slug}`)
    fetchData(slug)
  }

  const share = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const fas = data?.fas
  const event = data?.event
  const cities = data?.cities ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#04050a', color: '#fff', fontFamily: "'Syne', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/globe" style={{ fontSize: 13, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
            fanglobe<span style={{ color: '#39FF76' }}>.live</span>
          </a>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>/</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>city leaderboard</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={share} style={{ fontSize: 11, fontWeight: 700, color: '#39FF76', background: 'rgba(57,255,118,0.1)', border: '1px solid rgba(57,255,118,0.25)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
            {copied ? '✓ Copied' : 'Share ↗'}
          </button>
          <a href="/globe" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '5px 12px', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace" }}>
            ← Globe
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

        {/* Match selector */}
        {data?.events && data.events.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {data.events.map(ev => {
              const active = (ev.slug ?? ev.id) === (selectedMatch ?? data.event?.slug ?? data.event?.id)
              return (
                <button key={ev.id} onClick={() => switchMatch(ev.slug ?? ev.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: active ? '#39FF76' : 'rgba(255,255,255,0.07)', color: active ? '#000' : 'rgba(255,255,255,0.45)',
                  fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: active ? 700 : 400, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 12 }}>{ev.homeFlag}</span>
                  {ev.homeTeam.split(' ').slice(-1)[0]} v {ev.awayTeam.split(' ').slice(-1)[0]}
                  <span style={{ fontSize: 12 }}>{ev.awayFlag}</span>
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(57,255,118,0.15)', borderTopColor: '#39FF76', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px' }}>LOADING...</div>
          </div>
        ) : (
          <>
            {/* Hero: FAS score + match info */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              {fas && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace", color: fas.color, textShadow: `0 0 40px ${fas.color}55` }}>{fas.score}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: fas.color, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>FAS</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{fas.label}</div>
                </div>
              )}
              <div style={{ flex: 1 }}>
                {event && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                      {event.homeFlag} {event.homeTeam} <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>vs</span> {event.awayTeam} {event.awayFlag}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(event.kickoffAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#39FF76', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(data?.totalFans ?? 0)}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>fans watching</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{data?.countryCount ?? 0}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>countries</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{cities.length}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>cities on globe</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>#</span>
                <span>City</span>
                <span style={{ textAlign: 'right' }}>Fans</span>
                <span style={{ textAlign: 'right' }}>Share</span>
              </div>

              {cities.map((city, i) => {
                const rankStyle = RANK_STYLE[i] ?? null
                const total = data?.totalFans ?? 1
                const pct = Math.round((city.count / total) * 100)
                const barWidth = Math.max(2, pct)
                return (
                  <div key={city.city} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px', gap: 8,
                    padding: '12px 16px', borderBottom: i < cities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.1s',
                  }}>
                    {/* Rank */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {rankStyle ? (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: rankStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: rankStyle.color, fontFamily: "'JetBrains Mono', monospace" }}>{i+1}</div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', width: 24, display: 'block' }}>{i+1}</span>
                      )}
                    </div>
                    {/* City */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{city.flag}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city.city}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{city.country}</div>
                      </div>
                    </div>
                    {/* Fan count */}
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#39FF76', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(city.count)}</span>
                    </div>
                    {/* Bar + pct */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div style={{ width: 40, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${barWidth}%`, height: '100%', background: '#39FF76', borderRadius: 100 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer CTA */}
            <div style={{ textAlign: 'center', marginTop: 24, padding: '20px', background: 'rgba(57,255,118,0.06)', border: '1px solid rgba(57,255,118,0.15)', borderRadius: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Is your city on the leaderboard?</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Drop your pin on the globe and represent your city.</div>
              <a href="/globe" style={{ display: 'inline-block', background: '#39FF76', color: '#000', fontWeight: 800, fontSize: 13, padding: '10px 28px', borderRadius: 100, textDecoration: 'none', fontFamily: "'Syne', sans-serif", boxShadow: '0 0 24px rgba(57,255,118,0.3)' }}>
                📍 Drop my pin
              </a>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}