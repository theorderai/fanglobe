'use client'
import { useState, useCallback } from 'react'

interface Props {
  city: string
  cityRank: number
  flag: string
  country: string
  matchId: string
  sportId?: string
  sessionId: string
  accentColor: string
  onClose: () => void
}

export default function EmailCaptureModal({
  city, cityRank, flag, country, matchId, sportId, sessionId, accentColor, onClose
}: Props) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const rankLabel = cityRank === 1 ? '#1 🥇' : cityRank === 2 ? '#2 🥈' : cityRank === 3 ? '#3 🥉' : `#${cityRank}`

  const submit = useCallback(async () => {
    if (!email.trim() || loading) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email'); return
    }
    setLoading(true); setError('')
    try {
      await fetch('/api/notify/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(), sessionId,
          city, country, flag, cityRank, matchId, sportId,
        }),
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong — try again')
    } finally { setLoading(false) }
  }, [email, loading, city, country, flag, cityRank, matchId, sportId, sessionId])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#0d0d14', border: `1px solid ${accentColor}44`,
        borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 360,
        boxShadow: `0 0 60px ${accentColor}18, 0 24px 60px rgba(0,0,0,0.8)`,
        animation: 'popIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {!submitted ? (
          <>
            {/* City achievement */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{flag}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>
                {city} is {rankLabel}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                on the global fan leaderboard
              </div>
            </div>

            {/* Value prop */}
            <div style={{
              background: `${accentColor}0f`, border: `1px solid ${accentColor}22`,
              borderRadius: 12, padding: '12px 14px', marginBottom: 18,
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                🔔 Get notified if another city overtakes {city} — or if your rank improves before the final whistle.
              </div>
            </div>

            {/* Email input */}
            <div style={{ marginBottom: 8 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${error ? '#dc2626' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10, padding: '11px 14px', fontSize: 14,
                  color: '#fff', outline: 'none', fontFamily: "'Syne',sans-serif",
                }}
              />
              {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 5 }}>{error}</div>}
            </div>

            <button onClick={submit} disabled={loading || !email.trim()} style={{
              width: '100%', background: email.trim() ? accentColor : 'rgba(255,255,255,0.08)',
              color: email.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 100, padding: '12px 0',
              fontSize: 14, fontWeight: 800, cursor: email.trim() ? 'pointer' : 'default',
              fontFamily: "'Syne',sans-serif", transition: 'all 0.15s',
              boxShadow: email.trim() ? `0 0 20px ${accentColor}44` : 'none',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving...' : `Notify me about ${city}`}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono',monospace" }}>
              No spam. One email per match. Unsubscribe anytime.
            </div>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
              You're in!
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              We'll let you know if {city}'s rank changes.<br />
              Check the leaderboard to see where you stand.
            </div>
            <a href={`/leaderboard?match=${matchId}`} style={{
              display: 'inline-block', background: accentColor, color: '#000',
              fontWeight: 800, fontSize: 13, padding: '10px 24px', borderRadius: 100,
              textDecoration: 'none', fontFamily: "'Syne',sans-serif",
              boxShadow: `0 0 20px ${accentColor}44`,
            }}>
              View leaderboard →
            </a>
          </div>
        )}
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.92); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}