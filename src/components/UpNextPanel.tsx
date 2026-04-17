'use client'
import { useState, useEffect } from 'react'
import type { FanGlobeEvent } from '@/types'

interface Props {
  events: FanGlobeEvent[]
  currentMatchId: string
  sessionId: string
  accentColor: string
  onSelectMatch: (id: string) => void
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

export default function UpNextPanel({ events, currentMatchId, sessionId, accentColor, onSelectMatch }: Props) {
  const [reminders, setReminders] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('fg_reminders') ?? '[]')) } catch { return new Set() }
  })

  // Next 3 matches in next 48 hours (excluding current)
  const now = Date.now()
  const cutoff = now + 48 * 3600 * 1000
  const upcoming = events
    .filter(e => {
      const t = new Date(e.kickoffAt).getTime()
      const id = e.slug ?? e.id
      return t > now && t < cutoff && id !== currentMatchId && e.isFeatured
    })
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, 3)

  if (!upcoming.length) return null

  const toggleReminder = async (matchId: string) => {
    const next = new Set(reminders)
    if (next.has(matchId)) next.delete(matchId)
    else {
      next.add(matchId)
      // Save to backend for push notification
      try {
        await fetch('/api/notify/reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, sessionId }),
        })
      } catch {}
    }
    setReminders(next)
    try { localStorage.setItem('fg_reminders', JSON.stringify([...next])) } catch {}
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '14px 14px 12px',
      margin: '12px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
          ⚡ Up next for you
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono',monospace" }}>
          next 48hr
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {upcoming.map(ev => {
          const id = ev.slug ?? ev.id
          const ts = new Date(ev.kickoffAt)
          const hrs = (ts.getTime() - now) / 3600000
          const timeLabel = hrs < 1 ? `in ${Math.round(hrs * 60)}m`
                         : hrs < 24 ? `in ${Math.round(hrs)}h`
                         : ts.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' })
          const isReminded = reminders.has(id)
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: '9px 11px',
            }}>
              <div onClick={() => onSelectMatch(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, cursor: 'pointer' }}>
                <span style={{ fontSize: 16 }}>{ev.homeFlag}</span>
                <span style={{ fontSize: 16 }}>{ev.awayFlag}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne',sans-serif" }}>
                    {ev.homeTeam.split(' ').slice(-1)[0]} v {ev.awayTeam.split(' ').slice(-1)[0]}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
                    {timeLabel}
                  </div>
                </div>
              </div>
              <button onClick={() => toggleReminder(id)} style={{
                background: isReminded ? `${accentColor}18` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isReminded ? accentColor + '44' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
                fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                color: isReminded ? accentColor : 'rgba(255,255,255,0.5)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isReminded ? '✓ SET' : '🔔 REMIND'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
