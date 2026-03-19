'use client'
import { useState, useCallback } from 'react'
import type { Pulse, Sport } from '@/types'

interface Props {
  pulse: Pulse
  matchLabel: string
  sessionId: string
  matchId: string
  sport?: Sport
  accessToken: string | null
}

export default function PulseBar({ pulse, matchLabel, sessionId, matchId, sport, accessToken }: Props) {
  const [userVibe, setUserVibe] = useState<string | null>(null)
  const [localPulse, setLocalPulse] = useState<Pulse>(pulse)
  const [casting, setCasting] = useState(false)

  const vibes = sport?.vibes.filter(v => v.key !== 'moment') ?? [
    { key:'fire', emoji:'🔥', label:'Pumped' },
    { key:'ecstatic', emoji:'🎉', label:'Ecstatic' },
    { key:'nervous', emoji:'😰', label:'Nervous' },
    { key:'crushed', emoji:'💀', label:'Crushed' },
  ]

  const vibeColors: Record<string, { color: string; glow: string }> = {
    fire:     { color:'#ff6b35', glow:'rgba(255,107,53,0.45)' },
    ecstatic: { color:'#ffd166', glow:'rgba(255,209,102,0.45)' },
    nervous:  { color:'#a78bfa', glow:'rgba(167,139,250,0.45)' },
    crushed:  { color:'#60a5fa', glow:'rgba(96,165,250,0.45)' },
    moment:   { color:'#39ff76', glow:'rgba(57,255,118,0.45)' },
  }

  const accentColor = sport?.arcColor ? sport.arcColor + '1)' : '#39ff76'

  const merged: Pulse = {
    fire:     pulse.fire     + (localPulse.fire     - (pulse.fire     || 0)),
    ecstatic: pulse.ecstatic + (localPulse.ecstatic - (pulse.ecstatic || 0)),
    nervous:  pulse.nervous  + (localPulse.nervous  - (pulse.nervous  || 0)),
    crushed:  pulse.crushed  + (localPulse.crushed  - (pulse.crushed  || 0)),
    moment:   pulse.moment   + (localPulse.moment   - (pulse.moment   || 0)),
  }

  const vibeKeys = vibes.map(v => v.key)
  const total = Math.max(1, vibeKeys.reduce((s, k) => s + (merged[k] || 0), 0))
  const pct = (k: string) => Math.max(2, ((merged[k] || 0) / total) * 100)
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)

  const castVote = useCallback(async (vibe: string) => {
    if (casting || vibe === userVibe || !accessToken) return
    setCasting(true)
    const prev = userVibe
    setUserVibe(vibe)
    setLocalPulse(p => ({ ...p, [vibe]: (p[vibe]||0) + 1, ...(prev ? { [prev]: Math.max(0, (p[prev]||0) - 1) } : {}) }))
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${accessToken}` },
        body: JSON.stringify({ matchId, vibe, prevVibe: prev }),
      })
    } catch {
      setUserVibe(prev)
      setLocalPulse(p => ({ ...p, [vibe]: Math.max(0,(p[vibe]||0)-1), ...(prev ? { [prev]: (p[prev]||0)+1 } : {}) }))
    } finally { setCasting(false) }
  }, [casting, userVibe, matchId, accessToken])

  return (
    <div style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',paddingBottom:24,gap:10 }}>
      <div style={{ display:'flex',gap:8 }}>
        {vibes.map(v => {
          const voted = userVibe === v.key
          const vc = vibeColors[v.key] ?? { color: accentColor, glow: 'rgba(57,255,118,0.45)' }
          return (
            <button key={v.key} onClick={() => castVote(v.key)} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:voted ? 'rgba(255,255,255,0.07)' : 'rgba(6,7,10,0.8)',border:`1px solid ${voted ? vc.color : 'rgba(255,255,255,0.09)'}`,borderRadius:14,padding:'9px 14px',cursor:'pointer',minWidth:68,fontFamily:"'Syne',sans-serif",backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',transform:voted ? 'scale(1.06) translateY(-3px)' : 'none',boxShadow:voted ? `0 0 20px ${vc.glow}` : 'none',transition:'all 0.18s ease' }}>
              <span style={{ fontSize:20 }}>{v.emoji}</span>
              <span style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.5px',fontWeight:700 }}>{v.label.toUpperCase()}</span>
              <span style={{ fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:voted ? vc.color : 'rgba(255,255,255,0.65)' }}>{fmt(merged[v.key]||0)}</span>
            </button>
          )
        })}
      </div>

      <div style={{ background:'rgba(6,7,10,0.82)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:16,padding:'11px 18px',width:'min(520px,90vw)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',boxShadow:'0 0 0 1px rgba(255,255,255,0.02), 0 -8px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:9 }}>
          <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Match pulse</span>
          <span style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)' }}>{matchLabel}</span>
        </div>
        <div style={{ display:'flex',height:10,borderRadius:100,overflow:'hidden',gap:2 }}>
          {vibes.map(v => {
            const vc = vibeColors[v.key] ?? { color: accentColor, glow: '' }
            return <div key={v.key} style={{ width:`${pct(v.key)}%`,height:'100%',borderRadius:100,background:vc.color,transition:'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
          })}
        </div>
        <div style={{ display:'flex',gap:14,marginTop:7,flexWrap:'wrap' }}>
          {vibes.map(v => {
            const vc = vibeColors[v.key] ?? { color: accentColor, glow: '' }
            return <div key={v.key} style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:7,height:7,borderRadius:'50%',background:vc.color,flexShrink:0 }} /><span style={{ fontSize:10,color:'rgba(255,255,255,0.35)' }}>{v.label}</span></div>
          })}
        </div>
      </div>
    </div>
  )
}
