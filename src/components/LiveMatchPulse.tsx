'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Bucket {
  ts: string
  fire: number
  ecstatic: number
  nervous: number
  crushed: number
  total: number
}

interface Props {
  matchId: string
  accent: string
}

const VIBE_COLORS = {
  fire: '#ff6b35',
  ecstatic: '#ffd166',
  nervous: '#a78bfa',
  crushed: '#60a5fa',
}

const WINDOW_SECONDS = 60

export default function LiveMatchPulse({ matchId, accent }: Props) {
  const [buckets, setBuckets] = useState<Map<number, Bucket>>(new Map())
  const [peak, setPeak] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const bucketsRef = useRef(buckets)
  bucketsRef.current = buckets

  useEffect(() => {
    if (!matchId) return

    // Initial fetch
    fetch(`/api/pulse?matchId=${matchId}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { buckets: [] })
      .then(data => {
        const map = new Map<number, Bucket>()
        let maxT = 0
        for (const b of data.buckets ?? []) {
          const secKey = Math.floor(new Date(b.ts).getTime() / 1000)
          map.set(secKey, b)
          if (b.total > maxT) maxT = b.total
        }
        setBuckets(map)
        setPeak(Math.max(maxT, 5))
      })

    // Realtime subscription
    const supabase = getSupabaseClient()
    channelRef.current = supabase
      .channel(`pulse:${matchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'match_pulse',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const row = payload.new as Record<string, unknown>
        if (!row.bucket_ts) return
        const secKey = Math.floor(new Date(String(row.bucket_ts)).getTime() / 1000)
        const newBucket: Bucket = {
          ts: String(row.bucket_ts),
          fire: Number(row.fire_count ?? 0),
          ecstatic: Number(row.ecstatic_count ?? 0),
          nervous: Number(row.nervous_count ?? 0),
          crushed: Number(row.crushed_count ?? 0),
          total: Number(row.total ?? 0),
        }
        setBuckets(prev => {
          const next = new Map(prev)
          next.set(secKey, newBucket)
          return next
        })
        setPeak(prev => Math.max(prev, newBucket.total))
      })
      .subscribe()

    // Slide window every second — remove buckets older than 60s
    const interval = setInterval(() => {
      const cutoff = Math.floor(Date.now() / 1000) - WINDOW_SECONDS
      setBuckets(prev => {
        let changed = false
        const next = new Map<number, Bucket>()
        for (const [k, v] of prev) {
          if (k >= cutoff) next.set(k, v)
          else changed = true
        }
        return changed ? next : prev
      })
    }, 1000)

    return () => {
      channelRef.current?.unsubscribe()
      clearInterval(interval)
    }
  }, [matchId])

  // Build 60 columns — one per second
  const now = Math.floor(Date.now() / 1000)
  const columns: Bucket[] = []
  for (let i = WINDOW_SECONDS - 1; i >= 0; i--) {
    const secKey = now - i
    columns.push(buckets.get(secKey) ?? {
      ts: new Date(secKey * 1000).toISOString(),
      fire: 0, ecstatic: 0, nervous: 0, crushed: 0, total: 0,
    })
  }

  const totalVotes = columns.reduce((s, b) => s + b.total, 0)
  const dominant = columns.reduce((agg, b) => ({
    fire: agg.fire + b.fire,
    ecstatic: agg.ecstatic + b.ecstatic,
    nervous: agg.nervous + b.nervous,
    crushed: agg.crushed + b.crushed,
  }), { fire: 0, ecstatic: 0, nervous: 0, crushed: 0 })

  const dominantVibe = Object.entries(dominant).sort((a,b) => b[1] - a[1])[0]
  const dominantColor = dominantVibe[1] > 0 ? VIBE_COLORS[dominantVibe[0] as keyof typeof VIBE_COLORS] : accent

  // Active heartbeat detection — spike in last 5 seconds
  const recentTotal = columns.slice(-5).reduce((s, b) => s + b.total, 0)
  const isHeartbeating = recentTotal > peak * 0.4 && recentTotal > 3

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '12px 14px 10px',
      margin: '10px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isHeartbeating ? '#ff6b35' : 'rgba(255,255,255,0.3)',
            animation: isHeartbeating ? 'heartbeat 0.8s ease-in-out infinite' : 'none',
          }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
            Live pulse · 60s
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace" }}>
          {totalVotes > 0 ? `${totalVotes} votes/min` : 'waiting'}
        </div>
      </div>

      {/* The heartbeat chart */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        height: 60, width: '100%',
        borderRadius: 6, overflow: 'hidden',
        background: 'rgba(0,0,0,0.3)',
        padding: '4px 2px',
      }}>
        {columns.map((b, i) => {
          const isLast = i === columns.length - 1
          const h = Math.max(2, (b.total / peak) * 52)
          return (
            <div key={i} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column-reverse',
              minWidth: 2,
              height: 52,
              transition: isLast ? 'none' : 'all 0.3s',
              opacity: b.total === 0 ? 0.15 : 1,
            }}>
              {/* Stacked bars by vibe */}
              {b.total > 0 ? (
                <>
                  {b.fire > 0 && (
                    <div style={{
                      height: `${(b.fire / b.total) * h}px`,
                      background: VIBE_COLORS.fire,
                      minHeight: 1,
                    }} />
                  )}
                  {b.ecstatic > 0 && (
                    <div style={{
                      height: `${(b.ecstatic / b.total) * h}px`,
                      background: VIBE_COLORS.ecstatic,
                      minHeight: 1,
                    }} />
                  )}
                  {b.nervous > 0 && (
                    <div style={{
                      height: `${(b.nervous / b.total) * h}px`,
                      background: VIBE_COLORS.nervous,
                      minHeight: 1,
                    }} />
                  )}
                  {b.crushed > 0 && (
                    <div style={{
                      height: `${(b.crushed / b.total) * h}px`,
                      background: VIBE_COLORS.crushed,
                      minHeight: 1,
                    }} />
                  )}
                </>
              ) : (
                <div style={{
                  height: '2px',
                  background: 'rgba(255,255,255,0.08)',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Current dominant vibe */}
      {totalVotes >= 5 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: dominantColor }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: dominantColor, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
              crowd is {dominantVibe[0] === 'fire' ? 'pumped' : dominantVibe[0] === 'crushed' ? 'gutted' : dominantVibe[0]}
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace" }}>
            now ←
          </div>
        </div>
      )}

      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
