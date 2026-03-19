'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BADGES } from '@/types'

interface PassportData {
  checkinCount: number
  sportsCount: number
  eventsCount: number
  badges: string[]
  streakDays: number
  favouriteSports: string[]
  favouriteTeams: Record<string, string>
  recentEvents: { label: string; sport: string; date: string }[]
}

const SPORT_EMOJIS: Record<string, string> = {
  soccer: '⚽', cricket: '🏏', f1: '🏎️', nba: '🏀', nfl: '🏈', baseball: '⚾'
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    </div>
  )
}

export default function PassportPage() {
  const { user, profile, accessToken, loading: authLoading } = useAuth()
  const [data, setData] = useState<PassportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    // Fetch passport data
    fetch('/api/passport', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    })
      .then(r => r.json())
      .then(d => { setData(d.passport); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authLoading, accessToken])

  // Mock data for first-time users
  const passport: PassportData = data ?? {
    checkinCount: 0, sportsCount: 0, eventsCount: 0,
    badges: [], streakDays: 0, favouriteSports: [], favouriteTeams: {},
    recentEvents: [],
  }

  const earnedBadges = passport.badges.map(b => BADGES[b]).filter(Boolean)
  const unearned = Object.entries(BADGES).filter(([k]) => !passport.badges.includes(k))

  const accentColor = '#39ff76'

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Syne', sans-serif", padding: '80px 24px 40px' }}>
      {/* Back button */}
      <a href="/globe" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none', marginBottom: 32, fontFamily: "'JetBrains Mono', monospace" }}>
        ← Back to globe
      </a>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
          🌍
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {profile?.display_name ?? 'Fan Passport'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {user?.is_anonymous ? 'Anonymous fan · ' : ''}{passport.streakDays > 0 ? `🔥 ${passport.streakDays} day streak` : 'fanglobe.live'}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '2px' }}>
          LOADING...
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            <StatCard value={passport.checkinCount || 0} label="Check-ins" color={accentColor} />
            <StatCard value={passport.eventsCount || 0} label="Events" color="#ffd166" />
            <StatCard value={passport.sportsCount || 0} label="Sports" color="#00d4ff" />
            <StatCard value={passport.streakDays || 0} label="Day streak" color="#ff6b35" />
          </div>

          {/* Earned badges */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
              Badges earned ({earnedBadges.length})
            </div>
            {earnedBadges.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                Drop your first pin to start earning badges
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {earnedBadges.map((b, i) => (
                  <div key={i} style={{ background: 'rgba(57,255,118,0.07)', border: '1px solid rgba(57,255,118,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{b.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked badges */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
              Locked badges ({unearned.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {unearned.map(([, b]) => (
                <div key={b.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
                  <span style={{ fontSize: 22, filter: 'grayscale(1)' }}>{b.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{b.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favourite sports */}
          {passport.favouriteSports.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
                Your sports
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {passport.favouriteSports.map(s => (
                  <div key={s} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{SPORT_EMOJIS[s] ?? '🏆'}</span>
                    <span style={{ fontWeight: 600 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA if no checkins */}
          {passport.checkinCount === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <a href="/globe" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: accentColor, color: '#000', border: 'none',
                borderRadius: 100, padding: '13px 28px', fontSize: 14, fontWeight: 800,
                textDecoration: 'none', boxShadow: '0 0 32px rgba(57,255,118,0.4)',
              }}>
                📍 Drop your first pin
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
