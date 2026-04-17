'use client'
import { useState, useEffect, useCallback } from 'react'

interface SquadMember {
  session_id: string
  city?: string
  flag?: string
  team_side?: string
  joined_at: string
}

interface Squad {
  id: string
  code: string
  name: string
  match_id: string
  member_count: number
}

interface Props {
  matchId: string
  sessionId: string
  accent: string
  userCity?: string
  userFlag?: string
  userLat?: number
  userLng?: number
  userTeamSide?: string
  onClose: () => void
}

export default function SquadPanel({
  matchId, sessionId, accent, userCity, userFlag, userLat, userLng, userTeamSide, onClose
}: Props) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'active'>('menu')
  const [squadName, setSquadName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [squad, setSquad] = useState<Squad | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Check localStorage for existing squad membership
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`fg_squad_${matchId}`)
      if (saved) {
        const { code } = JSON.parse(saved)
        if (code) refreshSquad(code)
      }
    } catch {}
  }, [matchId]) // eslint-disable-line

  const refreshSquad = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/squad?code=${code}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.squad) {
        setSquad(data.squad)
        setMembers(data.members ?? [])
        setMode('active')
      }
    } catch {}
  }, [])

  const createSquad = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create', matchId, sessionId,
          name: squadName.trim() || 'Fan Squad',
          city: userCity, flag: userFlag,
          lat: userLat, lng: userLng,
          teamSide: userTeamSide,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem(`fg_squad_${matchId}`, JSON.stringify({ code: data.code }))
      refreshSquad(data.code)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create squad')
    } finally { setLoading(false) }
  }, [squadName, matchId, sessionId, userCity, userFlag, userLat, userLng, userTeamSide, refreshSquad])

  const joinSquad = useCallback(async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setError('Enter a valid code'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join', code, sessionId,
          city: userCity, flag: userFlag,
          lat: userLat, lng: userLng,
          teamSide: userTeamSide,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem(`fg_squad_${matchId}`, JSON.stringify({ code }))
      refreshSquad(code)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Squad not found')
    } finally { setLoading(false) }
  }, [joinCode, sessionId, userCity, userFlag, userLat, userLng, userTeamSide, matchId, refreshSquad])

  const share = useCallback(async () => {
    if (!squad) return
    const url = `https://fanglobe.live/join/${squad.code}`
    const text = `Join my squad on FanGlobe — we're watching together. Code: ${squad.code}`
    if (navigator.share) {
      try { await navigator.share({ title: 'FanGlobe Squad', text, url }) } catch {}
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }, [squad])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#0d0d14', border: `1px solid ${accent}33`,
        borderRadius: 20, padding: '24px 22px 22px', width: '100%', maxWidth: 380,
        boxShadow: `0 0 80px ${accent}22, 0 30px 70px rgba(0,0,0,0.85)`,
        animation: 'popIn 0.3s cubic-bezier(0.16,1.1,0.3,1)',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
        }}>✕</button>

        {mode === 'menu' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>
                Watch with friends
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Your 4 closest friends' pins cluster on the globe. Create or join a squad.
              </div>
            </div>
            <button onClick={() => setMode('create')} style={primaryBtn(accent)}>
              ✨ Create a squad
            </button>
            <button onClick={() => setMode('join')} style={secondaryBtn()}>
              🔗 Join with a code
            </button>
          </>
        )}

        {mode === 'create' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
              Create your squad
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
              We'll give you a code to share with friends.
            </div>
            <input
              type="text" placeholder="Squad name (optional)"
              value={squadName} onChange={e => setSquadName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createSquad()}
              autoFocus maxLength={30}
              style={inputStyle}
            />
            {error && <div style={errorStyle}>{error}</div>}
            <button onClick={createSquad} disabled={loading} style={primaryBtn(accent, loading)}>
              {loading ? 'Creating...' : 'Create squad →'}
            </button>
            <button onClick={() => setMode('menu')} style={ghostBtn()}>← back</button>
          </>
        )}

        {mode === 'join' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
              Join a squad
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
              Enter the 6-character code your friend shared.
            </div>
            <input
              type="text" placeholder="ABCD12"
              value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinSquad()}
              autoFocus maxLength={6}
              style={{...inputStyle, letterSpacing: '4px', fontSize: 18, fontFamily: "'JetBrains Mono',monospace", textAlign: 'center', fontWeight: 700}}
            />
            {error && <div style={errorStyle}>{error}</div>}
            <button onClick={joinSquad} disabled={loading || joinCode.length !== 6} style={primaryBtn(accent, loading || joinCode.length !== 6)}>
              {loading ? 'Joining...' : 'Join squad →'}
            </button>
            <button onClick={() => setMode('menu')} style={ghostBtn()}>← back</button>
          </>
        )}

        {mode === 'active' && squad && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
                Squad active
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" }}>
                {squad.name}
              </div>
            </div>

            {/* Share code */}
            <div style={{
              background: `${accent}0f`, border: `1px solid ${accent}33`,
              borderRadius: 12, padding: '16px 18px', marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                SHARE CODE
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: '6px', fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
                {squad.code}
              </div>
              <button onClick={share} style={{
                background: accent, color: '#000', border: 'none', borderRadius: 100,
                padding: '8px 20px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                fontFamily: "'Syne',sans-serif",
              }}>
                {copied ? '✓ Copied' : '↗ Share with friends'}
              </button>
            </div>

            {/* Members */}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {members.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  background: m.session_id === sessionId ? `${accent}14` : 'rgba(255,255,255,0.03)',
                  border: m.session_id === sessionId ? `1px solid ${accent}44` : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: 18 }}>{m.flag ?? '📍'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {m.session_id === sessionId ? 'You' : (m.city ?? 'Unknown')}
                    </div>
                    {m.session_id !== sessionId && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace" }}>
                        joined {timeAgo(m.joined_at)}
                      </div>
                    )}
                  </div>
                  {m.team_side && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: m.team_side === 'home' ? accent : '#00B4FF', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
                      {m.team_side}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ago`
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
  padding: '11px 14px', fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: "'Syne',sans-serif", marginBottom: 12,
}

const errorStyle: React.CSSProperties = {
  fontSize: 11, color: '#dc2626', marginBottom: 12, textAlign: 'center',
}

function primaryBtn(accent: string, disabled = false): React.CSSProperties {
  return {
    width: '100%', background: disabled ? 'rgba(255,255,255,0.08)' : accent,
    color: disabled ? 'rgba(255,255,255,0.3)' : '#000', border: 'none',
    borderRadius: 100, padding: '12px 0', fontSize: 14, fontWeight: 800,
    cursor: disabled ? 'default' : 'pointer', fontFamily: "'Syne',sans-serif",
    marginBottom: 8, boxShadow: disabled ? 'none' : `0 0 20px ${accent}44`,
  }
}

function secondaryBtn(): React.CSSProperties {
  return {
    width: '100%', background: 'rgba(255,255,255,0.06)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100,
    padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Syne',sans-serif",
  }
}

function ghostBtn(): React.CSSProperties {
  return {
    width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.4)',
    border: 'none', padding: '8px 0', fontSize: 11, cursor: 'pointer',
    fontFamily: "'JetBrains Mono',monospace", marginTop: 4,
  }
}
