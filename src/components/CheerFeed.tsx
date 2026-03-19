'use client'
import { useState } from 'react'
import type { Cheer } from '@/types'

interface Props {
  cheers: Cheer[]; sessionId: string; matchId: string
  userCity?: string; userFlag?: string
}

const VIBE_EMOJI: Record<string, string> = {
  fire:'🔥', ecstatic:'🎉', nervous:'😰', crushed:'💀', moment:'⚡'
}

export default function CheerFeed({ cheers, sessionId, matchId, userCity, userFlag }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/cheer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, text: text.trim(), sessionId, city: userCity, flag: userFlag }),
      })
      setText(''); setSent(true); setShowInput(false)
      setTimeout(() => setSent(false), 3000)
    } catch { /* silent */ } finally { setSending(false) }
  }

  return (
    <div style={{ position:'fixed',left:24,top:'50%',transform:'translateY(-50%)',width:190,zIndex:20 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Live cheers</span>
        <button onClick={() => setShowInput(v => !v)} style={{ fontSize:9,fontWeight:700,color:'#39ff76',background:'rgba(57,255,118,0.1)',border:'1px solid rgba(57,255,118,0.2)',borderRadius:100,padding:'2px 8px',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace" }}>
          {showInput ? '✕' : '+ add'}
        </button>
      </div>

      {showInput && (
        <div style={{ marginBottom:8,background:'rgba(6,7,10,0.85)',border:'1px solid rgba(57,255,118,0.25)',borderRadius:12,padding:10,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)' }}>
          <textarea value={text} onChange={e => setText(e.target.value.slice(0,160))} placeholder="Your cheer..." rows={2}
            style={{ width:'100%',background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:12,resize:'none',fontFamily:"'Syne',sans-serif",lineHeight:1.4 }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6 }}>
            <span style={{ fontSize:9,color:'rgba(255,255,255,0.25)',fontFamily:"'JetBrains Mono',monospace" }}>{text.length}/160</span>
            <button onClick={submit} disabled={sending || !text.trim()} style={{ fontSize:10,fontWeight:700,background:text.trim() ? '#39ff76' : 'rgba(255,255,255,0.1)',color:text.trim() ? '#000' : 'rgba(255,255,255,0.3)',border:'none',borderRadius:100,padding:'4px 12px',cursor:text.trim() ? 'pointer' : 'default',fontFamily:"'Syne',sans-serif",transition:'all 0.15s' }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {sent && <div style={{ marginBottom:8,background:'rgba(57,255,118,0.1)',border:'1px solid rgba(57,255,118,0.25)',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#39ff76',fontWeight:600 }}>Cheer sent!</div>}

      {cheers.map((c, i) => (
        <div key={c.id} style={{ background:'rgba(6,7,10,0.8)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 11px',marginBottom:i<cheers.length-1?6:0,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',animation:'slideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:3 }}>
            <span style={{ fontSize:11 }}>{c.flag}</span>
            <span style={{ fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,flex:1 }}>{c.city}</span>
            {c.vibe && <span style={{ fontSize:10 }}>{VIBE_EMOJI[c.vibe] ?? ''}</span>}
          </div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.82)',lineHeight:1.4 }}>{c.text}</div>
        </div>
      ))}
    </div>
  )
}
