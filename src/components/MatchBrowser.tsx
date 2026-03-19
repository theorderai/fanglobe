'use client'
import { useState, useEffect, useMemo } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import type { FanGlobeEvent } from '@/types'

interface MatchSnapshot {
  totalCount: number
  pulse: { fire: number; ecstatic: number; nervous: number; crushed: number; moment: number }
}

interface Props {
  events: FanGlobeEvent[]
  activeEventId: string
  onSelect: (id: string) => void
  snapshots: Record<string, MatchSnapshot>
}

// ── Date strip helpers ──────────────────────────────────────────────────────
function getEventDates(events: FanGlobeEvent[]): Date[] {
  const seen = new Set<string>()
  const dates: Date[] = []
  for (const e of events) {
    const d = new Date(e.kickoffAt)
    const key = d.toDateString()
    if (!seen.has(key)) { seen.add(key); dates.push(d) }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDayLabel(d: Date): { top: string; bot: string } {
  const now = new Date()
  if (isSameDay(d, now)) return { top: 'Today', bot: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(d, tomorrow)) return { top: 'Tomorrow', bot: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  return {
    top: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    bot: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

// ── Vibe badge ──────────────────────────────────────────────────────────────
function vibeBadge(pulse?: MatchSnapshot['pulse']): { emoji: string; label: string } | null {
  if (!pulse) return null
  const total = Object.values(pulse).reduce((a, b) => a + b, 0)
  if (total < 10) return null
  const top = Object.entries(pulse).sort((a, b) => b[1] - a[1])[0]
  const map: Record<string, { emoji: string; label: string }> = {
    fire:     { emoji: '🔥', label: 'Pumped' },
    ecstatic: { emoji: '🎉', label: 'Ecstatic' },
    nervous:  { emoji: '😰', label: 'Nervous' },
    crushed:  { emoji: '💀', label: 'Gutted' },
    moment:   { emoji: '⚡', label: 'Buzzing' },
  }
  return map[top[0]] ?? null
}

function fmtFans(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

// ── Single match card ───────────────────────────────────────────────────────
function MatchCard({ event, active, snap, onSelect }: {
  event: FanGlobeEvent; active: boolean; snap?: MatchSnapshot; onSelect: () => void
}) {
  const countdown = useCountdown(event.kickoffAt)
  const isLive = countdown === 'LIVE'
  const sport = event.sport
  const accent = sport?.arcColor ? sport.arcColor + '1)' : 'rgba(57,255,118,1)'
  const vibe = vibeBadge(snap?.pulse)
  const fans = snap?.totalCount ?? 0

  const kickoffTime = new Date(event.kickoffAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })

  return (
    <button onClick={onSelect} style={{
      width: '100%', background: active ? 'rgba(255,255,255,0.06)' : 'rgba(4,5,8,0.7)',
      border: `1px solid ${active ? accent.replace('1)', '0.35)') : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 12,
      textAlign: 'left', transition: 'all 0.15s ease',
      boxShadow: active ? `0 0 0 1px ${accent.replace('1)', '0.2)')}` : 'none',
    }}>
      {/* Live / upcoming indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, width: 32 }}>
        {isLive ? (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', boxShadow: '0 0 6px #dc2626' }} />
        ) : (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        )}
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: isLive ? '#dc2626' : 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.5px' }}>
          {isLive ? 'LIVE' : ''}
        </span>
      </div>

      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>
          {isLive ? `🔴 LIVE · ${event.venueShort}` : `${kickoffTime} · ${event.venueShort}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>{event.homeFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: event.homeColor ?? '#fff', fontFamily: "'Syne', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.homeTeam}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18 }}>{event.awayFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: event.awayColor ? event.awayColor + 'cc' : 'rgba(255,255,255,0.6)', fontFamily: "'Syne', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.awayTeam}
          </span>
        </div>
      </div>

      {/* Right: fan count + vibe */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {fans > 0 ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: active ? accent : '#fff', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {fmtFans(fans)}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '0.5px' }}>fans watching</div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
            {countdown}
          </div>
        )}
        {vibe && (
          <div style={{ marginTop: 5, fontSize: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {vibe.emoji} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{vibe.label}</span>
          </div>
        )}
        {event.isRivalry && (
          <div style={{ marginTop: 4, fontSize: 9, color: '#ff6b35', fontWeight: 700, letterSpacing: '0.5px' }}>⚔️ RIVALRY</div>
        )}
      </div>
    </button>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MatchBrowser({ events, activeEventId, onSelect, snapshots }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSport, setActiveSport] = useState('soccer')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const activeEvent = events.find(e => e.id === activeEventId)

  // Sport filter
  const sportEvents = useMemo(() => events.filter(e => e.sportId === activeSport), [events, activeSport])
  const dates = useMemo(() => getEventDates(sportEvents), [sportEvents])

  // Auto-select first date
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0])
  }, [dates, selectedDate])

  // Filter events by selected date
  const dayEvents = useMemo(() => {
    if (!selectedDate) return sportEvents
    return sportEvents.filter(e => isSameDay(new Date(e.kickoffAt), selectedDate))
  }, [sportEvents, selectedDate])

  // Live events across all sports
  const liveCount = events.filter(e => {
    const diff = new Date(e.kickoffAt).getTime() - Date.now()
    return diff < 0 && diff > -120 * 60 * 1000 // started within 2 hours
  }).length

  const availableSports = ['soccer', 'cricket', 'f1', 'nba'].filter(s => events.some(e => e.sportId === s))
  const sportEmoji: Record<string, string> = { soccer: '⚽', cricket: '🏏', f1: '🏎️', nba: '🏀', nfl: '🏈' }

  const handleSelect = (id: string) => {
    onSelect(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger tab — sits above pulse bar */}
      <button onClick={() => setIsOpen(true)} style={{
        position: 'fixed', bottom: 148, left: '50%', transform: 'translateX(-50%)',
        zIndex: 25, background: 'rgba(4,5,8,0.9)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 100, padding: '7px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', backdropFilter: 'blur(16px)',
        fontFamily: "'Syne', sans-serif",
      }}>
        {liveCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block', boxShadow: '0 0 4px #dc2626' }} />
            {liveCount} live
          </span>
        )}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {activeEvent ? `${activeEvent.homeFlag} ${activeEvent.homeTeam.split(' ').slice(-1)[0]} vs ${activeEvent.awayTeam.split(' ').slice(-1)[0]} ${activeEvent.awayFlag}` : 'Browse matches'}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>↑</span>
      </button>

      {/* Slide-up panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div style={{
            background: 'rgba(4,5,8,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px 20px 0 0',
            maxHeight: '82vh', display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 12px' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>Match Schedule</div>
                {liveCount > 0 && (
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    {liveCount} match{liveCount > 1 ? 'es' : ''} live now · {Object.keys(snapshots).length > 0 ? fmtFans(Object.values(snapshots).reduce((a, b) => a + (b.totalCount ?? 0), 0)) : '—'} fans watching
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Sport tabs */}
            <div style={{ display: 'flex', gap: 6, padding: '0 18px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {availableSports.map(s => {
                const isActive = s === activeSport
                return (
                  <button key={s} onClick={() => { setActiveSport(s); setSelectedDate(null) }} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 14 }}>{sportEmoji[s]}</span>
                    {s === 'soccer' ? 'Football' : s === 'f1' ? 'Formula 1' : s.toUpperCase()}
                  </button>
                )
              })}
            </div>

            {/* Date strip */}
            <div style={{ display: 'flex', gap: 4, padding: '0 18px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {dates.slice(0, 14).map(d => {
                const isActive = selectedDate && isSameDay(d, selectedDate)
                const lbl = formatDayLabel(d)
                const hasLive = sportEvents.some(e => {
                  const ed = new Date(e.kickoffAt)
                  return isSameDay(ed, d) && Date.now() > ed.getTime()
                })
                return (
                  <button key={d.toDateString()} onClick={() => setSelectedDate(d)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    padding: '7px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: isActive ? '#fff' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.15s', minWidth: 52, position: 'relative',
                  }}>
                    {hasLive && (
                      <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#dc2626' }} />
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? '#000' : 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
                      {lbl.top}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#000' : 'rgba(255,255,255,0.7)' }}>
                      {lbl.bot}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Match list */}
            <div style={{ overflowY: 'auto', padding: '0 14px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '32px 0', fontSize: 13, fontFamily: "'Syne', sans-serif" }}>
                  No matches on this day
                </div>
              ) : (
                dayEvents.map(ev => (
                  <MatchCard
                    key={ev.id} event={ev}
                    active={ev.id === activeEventId}
                    snap={snapshots[ev.id]}
                    onSelect={() => handleSelect(ev.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
