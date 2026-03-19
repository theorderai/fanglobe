'use client'
import { useState, useCallback } from 'react'
import type { FanGlobeEvent } from '@/types'

interface Props {
  event: FanGlobeEvent
  accessToken: string | null
}

export default function MomentPulse({ event, accessToken }: Props) {
  const [reacting, setReacting] = useState(false)
  const [lastCount, setLastCount] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(false)

  const sport = event.sport
  const momentVibe = sport?.vibes.find(v => v.key === 'moment') ?? { emoji: '⚡', label: 'MOMENT!' }
  const accentColor = sport?.arcColor ? sport.arcColor + '1)' : '#39ff76'

  const triggerMoment = useCallback(async () => {
    if (cooldown || !accessToken) return
    setCooldown(true)
    setReacting(true)

    try {
      const res = await fetch('/api/moment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          sportId: event.sportId,
          type: 'moment',
          label: `${momentVibe.emoji} Moment`,
          minute: null,
        }),
      })
      const data = await res.json()
      if (data.reactionCount) setLastCount(data.reactionCount)
    } catch { /* silent */ }

    setTimeout(() => setReacting(false), 600)
    setTimeout(() => setCooldown(false), 3000)
  }, [cooldown, accessToken, event, momentVibe])

  return (
    <div style={{
      position: 'fixed', bottom: 230, right: 24, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      {lastCount && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: accentColor,
          fontFamily: "'JetBrains Mono', monospace",
          animation: 'fadeInUp 0.3s ease',
        }}>
          {lastCount.toLocaleString()} reacts
        </div>
      )}
      <button
        onClick={triggerMoment}
        disabled={cooldown}
        className="moment-btn"
        style={{
          width: 54, height: 54, borderRadius: '50%',
          background: reacting ? accentColor : 'rgba(6,7,10,0.85)',
          border: `2px solid ${accentColor}`,
          cursor: cooldown ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, transition: 'all 0.15s ease',
          transform: reacting ? 'scale(1.18)' : cooldown ? 'scale(0.95)' : 'scale(1)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: reacting ? `0 0 32px ${accentColor}` : `0 0 12px rgba(0,0,0,0.4)`,
          opacity: cooldown && !reacting ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: 22 }}>{momentVibe.emoji}</span>
        <span style={{
          fontSize: 8, fontWeight: 800, letterSpacing: '0.5px',
          color: reacting ? '#000' : accentColor,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {reacting ? 'SENT!' : momentVibe.label}
        </span>
      </button>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', maxWidth: 64, lineHeight: 1.3 }}>
        React to key moment
      </div>
    </div>
  )
}
