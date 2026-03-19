'use client'
import { useState } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { SPORT_LIST } from '@/types'
import type { FanGlobeEvent } from '@/types'

interface Props {
  events: FanGlobeEvent[]
  activeEventId: string
  onSelect: (eventId: string) => void
}

// Group events into competitions
function groupByCompetition(events: FanGlobeEvent[]): { label: string; emoji: string; events: FanGlobeEvent[] }[] {
  const groups: Record<string, { label: string; emoji: string; events: FanGlobeEvent[] }> = {}

  for (const e of events) {
    let key = 'other'
    let label = 'Other'
    let emoji = e.sport?.emoji ?? '🏆'

    if (e.sportId === 'soccer') {
      if (e.id.startsWith('wc-') || e.id.includes('world-cup') || e.id === 'wc-final') {
        key = 'worldcup'; label = 'World Cup 2026'; emoji = '🏆'
      } else if (e.id.startsWith('ucl-') || e.homeTeam === 'Champions League') {
        key = 'ucl'; label = "Champions League"; emoji = '⭐'
      } else if (e.id === 'wimbledon-2026') {
        key = 'wimbledon'; label = 'Wimbledon 2026'; emoji = '🎾'
      } else {
        key = 'soccer-other'; label = 'Football'; emoji = '⚽'
      }
    } else if (e.sportId === 'cricket') {
      if (e.id.startsWith('ipl-')) {
        key = 'ipl'; label = 'IPL 2026'; emoji = '🏏'
      } else {
        key = 'cricket-intl'; label = 'International Cricket'; emoji = '🏏'
      }
    } else if (e.sportId === 'f1') {
      key = 'f1'; label = 'Formula 1 2026'; emoji = '🏎️'
    } else if (e.sportId === 'nba') {
      key = 'nba'; label = 'NBA 2026'; emoji = '🏀'
    } else {
      key = e.sportId; label = e.sport?.name ?? 'Sport'; emoji = e.sport?.emoji ?? '🏆'
    }

    if (!groups[key]) groups[key] = { label, emoji, events: [] }
    groups[key].events.push(e)
  }

  // Sort groups by first event date
  return Object.values(groups).sort((a, b) =>
    new Date(a.events[0].kickoffAt).getTime() - new Date(b.events[0].kickoffAt).getTime()
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  if (diff < 0) return 'LIVE'
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function EventBtn({ event, active, onSelect }: { event: FanGlobeEvent; active: boolean; onSelect: () => void }) {
  const countdown = useCountdown(event.kickoffAt)
  const isLive = countdown === 'LIVE'
  const sport = event.sport
  const accent = sport?.arcColor ? sport.arcColor + '1)' : '#39ff76'

  // Short label for the pill
  const home = event.homeTeam.split(' ').slice(-1)[0]
  const away = event.awayTeam === 'TBD' || event.awayTeam === '2026' || event.awayTeam.startsWith('Round')
    ? null
    : event.awayTeam.split(' ').slice(-1)[0]

  return (
    <button onClick={onSelect} title={event.label} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 9px', borderRadius: 100, cursor: 'pointer',
      whiteSpace: 'nowrap', border: 'none', flexShrink: 0,
      fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600,
      transition: 'all 0.15s ease',
      background: active ? accent : 'rgba(255,255,255,0.06)',
      color: active ? '#000' : 'rgba(255,255,255,0.55)',
      boxShadow: active ? `0 0 12px ${accent.replace('1)', '0.3)')}` : 'none',
    }}>
      <span style={{ fontSize: 11 }}>{event.homeFlag}</span>
      <span>{home}</span>
      {away && <><span style={{ opacity: 0.4, fontSize: 9 }}>v</span><span>{away}</span><span style={{ fontSize: 11 }}>{event.awayFlag}</span></>}
      <span style={{
        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
        color: active ? '#000' : isLive ? '#39ff76' : 'rgba(255,255,255,0.35)',
        marginLeft: 1,
      }}>
        {isLive ? '●' : formatDate(event.kickoffAt)}
      </span>
      {event.isRivalry && !active && (
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff6b35', flexShrink: 0 }} />
      )}
    </button>
  )
}

export default function SportEventSwitcher({ events, activeEventId, onSelect }: Props) {
  const activeEvent = events.find(e => e.id === activeEventId) ?? events[0]
  const [activeSport, setActiveSport] = useState(activeEvent?.sportId ?? 'soccer')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const availableSports = SPORT_LIST.filter(s => events.some(e => e.sportId === s.id))
  const sportEvents = events.filter(e => e.sportId === activeSport)
  const groups = groupByCompetition(sportEvents)

  // Auto-select first group when sport changes
  const currentGroup = activeGroup ?? groups[0]?.label ?? null
  const groupEvents = groups.find(g => g.label === currentGroup)?.events ?? groups[0]?.events ?? []

  const handleSportClick = (sportId: string) => {
    setActiveSport(sportId)
    setActiveGroup(null)
    const first = events.find(e => e.sportId === sportId)
    if (first) onSelect(first.id)
  }

  const handleGroupClick = (label: string) => {
    setActiveGroup(label)
    const g = groups.find(g => g.label === label)
    if (g?.events[0]) onSelect(g.events[0].id)
  }

  const sport = SPORT_LIST.find(s => s.id === activeSport)
  const accent = sport?.arcColor ? sport.arcColor + '1)' : '#39ff76'

  return (
    <div style={{
      position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      maxWidth: '98vw', width: '98vw',
    }}>
      {/* Row 1: Sport tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(4,5,8,0.9)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 100, padding: 3,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 16px 40px rgba(0,0,0,0.6)',
      }}>
        {availableSports.map(s => {
          const isActive = s.id === activeSport
          const a = s.arcColor + '1)'
          const count = events.filter(e => e.sportId === s.id).length
          return (
            <button key={s.id} onClick={() => handleSportClick(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 9px', borderRadius: 100, cursor: 'pointer',
              border: 'none', fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
              transition: 'all 0.18s ease',
              background: isActive ? a : 'transparent',
              color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
            }}>
              <span style={{ fontSize: 13 }}>{s.emoji}</span>
              <span className="sport-name">{s.name}</span>
              <span style={{
                fontSize: 9, background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                borderRadius: 100, padding: '1px 5px',
                color: isActive ? '#000' : 'rgba(255,255,255,0.3)',
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Row 2: Competition group tabs */}
      {groups.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'rgba(4,5,8,0.85)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 100, padding: 3,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          {groups.map(g => {
            const isActive = g.label === currentGroup
            return (
              <button key={g.label} onClick={() => handleGroupClick(g.label)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
                border: 'none', fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600,
                transition: 'all 0.15s ease',
                background: isActive ? accent : 'transparent',
                color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
              }}>
                <span style={{ fontSize: 12 }}>{g.emoji}</span>
                {g.label}
                <span style={{
                  fontSize: 9,
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.07)',
                  borderRadius: 100, padding: '1px 4px',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.3)',
                }}>{g.events.length}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Row 3: Events — windowed, 6 at a time */}
      {(() => {
        const PAGE = 6
        const activeIdx = groupEvents.findIndex(e => e.id === activeEventId)
        const page = Math.floor(Math.max(0, activeIdx) / PAGE)
        const total = groupEvents.length
        const pages = Math.ceil(total / PAGE)
        const slice = groupEvents.slice(page * PAGE, page * PAGE + PAGE)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {page > 0 && (
              <button onClick={() => onSelect(groupEvents[(page - 1) * PAGE].id)} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                width: 24, height: 24, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>‹</button>
            )}
            <div style={{
              background: 'rgba(4,5,8,0.82)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 100, padding: '3px 4px',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              {slice.map(ev => (
                <EventBtn key={ev.id} event={ev} active={ev.id === activeEventId} onSelect={() => onSelect(ev.id)} />
              ))}
              {pages > 1 && (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', padding: '0 6px', fontFamily: "'JetBrains Mono',monospace" }}>
                  {page + 1}/{pages}
                </span>
              )}
            </div>
            {page < pages - 1 && (
              <button onClick={() => onSelect(groupEvents[(page + 1) * PAGE].id)} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                width: 24, height: 24, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>›</button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
