'use client'
import { useRef, useCallback } from 'react'
import type { FanGlobeEvent, Snapshot } from '@/types'

interface Props {
  event: FanGlobeEvent
  snapshot: Snapshot
  userCity?: string
  userRank?: number
  onClose: () => void
}

export default function ShareCard({ event, snapshot, userCity, userRank, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const sport = event.sport
  const accentColor = sport?.arcColor ? sport.arcColor + '1)' : 'rgba(57,255,118,1)'
  const total = snapshot.totalCount.toLocaleString()
  const countries = snapshot.countryCount

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import('html2canvas' as any)
      const html2canvas = mod.default ?? mod
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, backgroundColor: '#000',
        useCORS: true, logging: false,
      })
      const link = document.createElement('a')
      link.download = `fanglobe-${event.id}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      // Fallback: copy text
      navigator.clipboard?.writeText(
        `I watched ${event.label} with ${total} fans from ${countries} countries on fanglobe.live 🌍⚽`
      )
    }
  }, [event, total, countries])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      padding: 24, gap: 20,
    }}>
      {/* The shareable card */}
      <div ref={cardRef} style={{
        width: 320, background: '#000',
        border: `1px solid ${accentColor.replace('1)', '0.4)')}`,
        borderRadius: 20, padding: '28px 24px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        fontFamily: "'Syne', sans-serif",
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: accentColor.replace('1)', '0.12)'),
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Sport emoji */}
          <div style={{ fontSize: 32, marginBottom: 8 }}>{sport?.emoji ?? '⚽'}</div>

          {/* Match */}
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace", marginBottom: 8,
          }}>
            {event.venueShort}
          </div>

          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>
            {event.homeFlag} {event.homeTeam}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>vs</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 24, lineHeight: 1.2 }}>
            {event.awayFlag} {event.awayTeam}
          </div>

          {/* Stats */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 12,
            padding: '16px 20px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: accentColor, letterSpacing: -1, fontFamily: "'JetBrains Mono', monospace" }}>
              {total}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '1px' }}>
              fans worldwide
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{countries}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px' }}>countries</div>
            </div>
            {userCity && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: accentColor }}>#{userRank ?? '?'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px' }}>{userCity}</div>
              </div>
            )}
          </div>

          {/* Brand */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.5px',
          }}>
            fanglobe<span style={{ color: accentColor }}>.live</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, width: 320 }}>
        <button onClick={downloadCard} style={{
          flex: 2, background: accentColor, color: '#000',
          border: 'none', borderRadius: 100, padding: '13px 0',
          fontSize: 13, fontWeight: 800, fontFamily: "'Syne', sans-serif",
          cursor: 'pointer', boxShadow: `0 0 24px ${accentColor.replace('1)', '0.4)')}`,
        }}>
          Save card
        </button>
        <button onClick={onClose} style={{
          flex: 1, background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 100, padding: '13px 0',
          color: 'rgba(255,255,255,0.5)', fontSize: 13,
          cursor: 'pointer', fontFamily: "'Syne', sans-serif",
        }}>
          Close
        </button>
      </div>
    </div>
  )
}
