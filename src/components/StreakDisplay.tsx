'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  sessionId: string
  city?: string
  accent: string
  compact?: boolean
}

interface StreakData {
  user?: { currentStreak: number; longestStreak: number; matchesWatched: number; countriesWatched: number }
  city?: { name: string; currentStreak: number; longestStreak: number; bestRank: number; lastRank: number }
}

export default function StreakDisplay({ sessionId, city, accent, compact = false }: Props) {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const url = `/api/streak?sessionId=${sessionId}${city ? `&city=${encodeURIComponent(city)}` : ''}`
    fetch(url).then(r => r.ok ? r.json() : {}).then(setData).catch(() => {})
  }, [sessionId, city])

  if (!data) return null
  if (!data.user && !data.city) return null

  const userStreak = data.user?.currentStreak ?? 0
  const cityStreak = data.city?.currentStreak ?? 0
  const hotUser = userStreak >= 3
  const hotCity = cityStreak >= 5

  if (compact) {
    if (userStreak === 0 && cityStreak === 0) return null
    return (
      <Link href="/passport" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 100,
        background: hotUser || hotCity ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hotUser || hotCity ? 'rgba(255,107,53,0.35)' : 'rgba(255,255,255,0.08)'}`,
        textDecoration: 'none',
      }}>
        {userStreak > 0 && (
          <span style={{ fontSize: 11, fontWeight: 800, color: hotUser ? '#ff6b35' : '#fff', fontFamily: "'JetBrains Mono',monospace" }}>
            🔥 {userStreak}
          </span>
        )}
        {cityStreak > 0 && (
          <>
            <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono',monospace" }}>
              {data.city?.name}: {cityStreak}
            </span>
          </>
        )}
      </Link>
    )
  }

  return (
    <div style={{
      display: 'flex', gap: 8,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '12px 14px',
      margin: '10px 0',
    }}>
      {/* Personal streak */}
      {data.user && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            Your streak
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 18 }}>{hotUser ? '🔥' : '🎯'}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: hotUser ? '#ff6b35' : '#fff', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>
              {userStreak}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              match{userStreak !== 1 ? 'es' : ''}
            </span>
          </div>
          {data.user.longestStreak > userStreak && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>
              best: {data.user.longestStreak}
            </div>
          )}
        </div>
      )}

      {data.user && data.city && (
        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
      )}

      {/* City streak */}
      {data.city && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            {data.city.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 18 }}>{hotCity ? '🏆' : '📍'}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: hotCity ? accent : '#fff', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>
              {cityStreak}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              top-10 run
            </span>
          </div>
          {data.city.bestRank > 0 && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>
              best: #{data.city.bestRank}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
