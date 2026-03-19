'use client'
import { useState, useEffect } from 'react'
import type { Snapshot, FanGlobeEvent } from '@/types'

interface Props {
  snapshot: Snapshot | null
  event: FanGlobeEvent
  accentColor: string
}

export default function LiveStatsTicker({ snapshot, event, accentColor }: Props) {
  const [idx, setIdx] = useState(0)

  const cities = snapshot?.cities ?? []
  const total = snapshot?.totalCount ?? 0
  const countries = snapshot?.countryCount ?? 0
  const loudest = cities[0]
  const pulse = snapshot?.pulse

  const totalPulse = pulse ? Object.values(pulse).reduce((a, b) => a + b, 0) : 0
  const dominantVibe = pulse
    ? Object.entries(pulse).sort((a, b) => b[1] - a[1])[0]
    : null

  const vibeLabel: Record<string, string> = {
    fire: '🔥 Pumped',
    ecstatic: '🎉 Ecstatic',
    nervous: '😰 Nervous',
    crushed: '💀 Crushed',
    moment: '⚡ Buzzing',
  }

  const stats = [
    loudest && `${loudest.flag} ${loudest.city} is loudest right now`,
    total > 0 && `${total.toLocaleString()} fans watching worldwide`,
    countries > 0 && `Fans in ${countries} countries`,
    snapshot?.homeCount && snapshot.awayCount && event.isRivalry
      && `${Math.round(snapshot.homeCount / Math.max(1, snapshot.homeCount + snapshot.awayCount) * 100)}% ${event.homeTeam} · ${Math.round(snapshot.awayCount / Math.max(1, snapshot.homeCount + snapshot.awayCount) * 100)}% ${event.awayTeam}`,
    dominantVibe && totalPulse > 0 && `${vibeLabel[dominantVibe[0]] ?? dominantVibe[0]} dominates the pulse`,
    `📍 Drop your pin — ${event.venueShort}`,
  ].filter(Boolean) as string[]

  useEffect(() => {
    if (stats.length === 0) return
    const id = setInterval(() => setIdx(i => (i + 1) % stats.length), 3000)
    return () => clearInterval(id)
  }, [stats.length])

  if (stats.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 15,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      paddingTop: 8,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: accentColor.replace('1)', '0.7)'),
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.5px',
        padding: '4px 14px',
        animation: 'fadeInOut 3s ease',
      }}>
        {stats[idx]}
      </div>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-2px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
