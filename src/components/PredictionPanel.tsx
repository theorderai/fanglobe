'use client'
import { useState, useEffect, useCallback } from 'react'
import type { FanGlobeEvent } from '@/types'

interface Props {
  event: FanGlobeEvent
  sessionId: string
  accentColor: string
}

interface Aggregates {
  [kind: string]: {
    total: number
    breakdown: Record<string, number>
  }
}

export default function PredictionPanel({ event, sessionId, accentColor }: Props) {
  const [aggs, setAggs] = useState<Aggregates>({})
  const [userPreds, setUserPreds] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const matchId = event.slug ?? event.id
  const kickoffTime = new Date(event.kickoffAt).getTime()
  const now = Date.now()
  const isPreMatch = kickoffTime > now
  const isLive = !isPreMatch && now < kickoffTime + 2.5 * 3600 * 1000

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch(`/api/predict?matchId=${matchId}&sessionId=${sessionId}`, { cache: 'no-store' })
      if (!res.ok) return
      const d = await res.json()
      setAggs(d.aggregates ?? {})
      setUserPreds(d.userPredictions ?? {})
    } catch {}
    finally { setLoading(false) }
  }, [matchId, sessionId])

  useEffect(() => { fetchPredictions() }, [fetchPredictions])

  const submit = useCallback(async (kind: string, prediction: unknown) => {
    if (submitting) return
    setSubmitting(kind)
    // Optimistic update
    const prevUser = userPreds[kind]
    setUserPreds(p => ({ ...p, [kind]: prediction }))
    try {
      await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, sessionId, kind, prediction }),
      })
      fetchPredictions()
    } catch {
      setUserPreds(p => ({ ...p, [kind]: prevUser }))
    } finally { setSubmitting(null) }
  }, [matchId, sessionId, userPreds, submitting, fetchPredictions])

  if (loading) return null
  if (!isPreMatch && !isLive) return null  // don't show post-match

  const winner = aggs.winner ?? { total: 0, breakdown: {} }
  const homePct = winner.total > 0 ? Math.round((Number(winner.breakdown['"home"'] ?? winner.breakdown['home'] ?? 0) / winner.total) * 100) : 0
  const awayPct = winner.total > 0 ? Math.round((Number(winner.breakdown['"away"'] ?? winner.breakdown['away'] ?? 0) / winner.total) * 100) : 0
  const drawPct = Math.max(0, 100 - homePct - awayPct)
  const userWinner = userPreds.winner as string | undefined

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '14px 14px 12px',
      margin: '12px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
          🔮 Predict the match
        </div>
        {winner.total > 0 && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace" }}>
            {winner.total} {winner.total === 1 ? 'vote' : 'votes'}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
        {userWinner ? 'Your pick is in. Change anytime before kickoff.' : 'Who wins?'}
      </div>

      {/* Winner prediction buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          { key: 'home', label: event.homeTeam.split(' ').slice(-1)[0], flag: event.homeFlag, color: event.homeColor ?? accentColor, pct: homePct },
          { key: 'draw', label: 'Draw', flag: '⚖️', color: 'rgba(255,255,255,0.5)', pct: drawPct },
          { key: 'away', label: event.awayTeam.split(' ').slice(-1)[0], flag: event.awayFlag, color: event.awayColor ?? '#00d4ff', pct: awayPct },
        ].map(opt => {
          const picked = userWinner === opt.key
          return (
            <button key={opt.key} onClick={() => submit('winner', opt.key)} disabled={submitting === 'winner'} style={{
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '9px 6px',
              background: picked ? `${opt.color}14` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${picked ? opt.color + '66' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
              opacity: submitting === 'winner' ? 0.5 : 1,
            }}>
              {/* Progress bar bg */}
              {winner.total > 0 && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: `${opt.pct}%`, height: 2, background: opt.color,
                  transition: 'width 0.5s ease',
                }} />
              )}
              <span style={{ fontSize: 16, lineHeight: 1 }}>{opt.flag}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: picked ? opt.color : 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', fontFamily: "'Syne',sans-serif", textTransform: 'uppercase' }}>
                {opt.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: picked ? '#fff' : 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono',monospace" }}>
                {winner.total > 0 ? `${opt.pct}%` : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Social proof copy */}
      {winner.total >= 3 && (() => {
        const leader = [{ k: 'home', t: event.homeTeam, p: homePct }, { k: 'draw', t: 'a draw', p: drawPct }, { k: 'away', t: event.awayTeam, p: awayPct }].sort((a, b) => b.p - a.p)[0]
        return (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>
            {leader.p}% of FanGlobe fans pick {leader.t}
          </div>
        )
      })()}
    </div>
  )
}
