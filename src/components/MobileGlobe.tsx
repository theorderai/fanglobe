'use client'
import dynamic from 'next/dynamic'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import PickYourSide from '@/components/PickYourSide'
import OnboardingOverlay from '@/components/OnboardingOverlay'
import MatchBrowser from '@/components/MatchBrowser'
import type { FanGlobeEvent, Snapshot, Cheer } from '@/types'

const GlobeComponent = dynamic(() => import('@/components/GlobeComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000' }}>
      <div style={{ width:36,height:36,borderRadius:'50%',border:'2px solid rgba(57,255,118,0.15)',borderTopColor:'#39ff76',animation:'spin 0.8s linear infinite' }} />
    </div>
  ),
})

interface Props {
  events: FanGlobeEvent[]
  activeEvent: FanGlobeEvent
  snapshot: Snapshot | null
  cheers: Cheer[]
  snapshots: Record<string, { totalCount:number; pulse:{fire:number;ecstatic:number;nervous:number;crushed:number;moment:number} }>
  onSwitchEvent: (id: string) => void
  accentColor: string
  activeSport: string
  onSwitchSport: (sportId: string) => void
}

const SPORT_CONFIG: Record<string, { name:string; emoji:string; accent:string; short:string }> = {
  soccer:  { name:'Football',  short:'Football',  emoji:'⚽', accent:'#39FF76' },
  cricket: { name:'Cricket',   short:'Cricket',   emoji:'🏏', accent:'#00B4FF' },
  f1:      { name:'Formula 1', short:'F1',        emoji:'🏎️', accent:'#DC2626' },
  nba:     { name:'NBA',       short:'NBA',       emoji:'🏀', accent:'#EA580C' },
}

const VIBE_CONFIG = [
  { key:'fire',     emoji:'🔥', label:'PUMPED',   color:'#ff6b35' },
  { key:'ecstatic', emoji:'🎉', label:'ECSTATIC', color:'#ffd166' },
  { key:'nervous',  emoji:'😰', label:'NERVOUS',  color:'#a78bfa' },
  { key:'crushed',  emoji:'💀', label:'GUTTED',   color:'#60a5fa' },
]

function fmtFans(n: number) {
  if (n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n>=1_000) return `${Math.round(n/1000)}K`
  return String(n)
}

function ActiveMatchPill({ event, accentColor }: { event: FanGlobeEvent; accentColor: string }) {
  const countdown = useCountdown(event.kickoffAt)
  const isLive = countdown === 'LIVE'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(4,5,8,0.85)', border:`1px solid ${isLive ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius:100, padding:'4px 8px', backdropFilter:'blur(12px)', flexShrink:0 }}>
      {isLive && <span style={{ width:5,height:5,borderRadius:'50%',background:'#dc2626',flexShrink:0,boxShadow:'0 0 4px #dc2626' }} />}
      <span style={{ fontSize:12 }}>{event.homeFlag}</span>
      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: isLive ? '#dc2626' : 'rgba(255,255,255,0.45)', fontWeight:700, letterSpacing:'0.5px' }}>
        {isLive ? 'LIVE' : countdown.split(':').slice(0,2).join(':')}
      </span>
      <span style={{ fontSize:12 }}>{event.awayFlag}</span>
    </div>
  )
}

export default function MobileGlobe({ events, activeEvent, snapshot, cheers, snapshots, onSwitchEvent, accentColor, activeSport, onSwitchSport }: Props) {
  const auth = useAuth()
  const [userPin, setUserPin] = useState<{lat:number;lng:number;color?:string}|null>(null)
  const [newCheckinPos, setNewCheckinPos] = useState<{lat:number;lng:number}|null>(null)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [pendingPin, setPendingPin] = useState<{lat:number;lng:number}|null>(null)
  const [showPickSide, setShowPickSide] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userVibe, setUserVibe] = useState<string|null>(null)
  const [momentWave, setMomentWave] = useState(false)
  const [toast, setToast] = useState<string|null>(null)
  const momentTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (!localStorage.getItem('fg_onboarded')) setTimeout(() => setShowOnboarding(true), 900)
  }, [])

  if (!activeEvent) return null

  const total = snapshot?.totalCount ?? 0
  const pulse = snapshot?.pulse ?? { fire:0, ecstatic:0, nervous:0, crushed:0, moment:0 }
  const countryCount = snapshot?.countryCount ?? 0
  const availableSports = Object.keys(SPORT_CONFIG).filter(s => events.some(e => e.sportId === s))
  const totalPulse = Math.max(1, VIBE_CONFIG.reduce((s,v) => s+(pulse[v.key]??0), 0))

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const handleCheckin = useCallback(async () => {
    if (checkinLoading || hasCheckedIn || auth.loading) return
    setCheckinLoading(true)
    const place = (lat: number, lng: number) => {
      setPendingPin({ lat, lng }); setCheckinLoading(false)
      if (activeEvent.isRivalry) setShowPickSide(true)
      else commitCheckin(lat, lng, 'neutral')
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => place(p.coords.latitude, p.coords.longitude), () => place(36+Math.random()*10,-100+Math.random()*35))
    } else { place(36+Math.random()*10,-100+Math.random()*35) }
  }, [checkinLoading, hasCheckedIn, auth.loading, activeEvent])

  const commitCheckin = useCallback(async (lat: number, lng: number, side: 'home'|'away'|'neutral') => {
    setShowPickSide(false)
    const pinColor = side==='home'?(activeEvent.homeColor??accentColor):side==='away'?(activeEvent.awayColor??'#00d4ff'):'rgba(255,255,255,0.95)'
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
      const res = await fetch('/api/checkin', { method:'POST', headers, body: JSON.stringify({ matchId: activeEvent.slug??activeEvent.id, lat, lng, teamSide: side }) })
      const data = await res.json()
      setUserPin({ lat, lng, color: pinColor }); setNewCheckinPos({ lat, lng }); setHasCheckedIn(true)
      showToast(data.city ? `${data.flag??'📍'} ${data.city} is on the globe!` : "You're on the globe! 🌍")
      setTimeout(() => setNewCheckinPos(null), 200)
    } catch { showToast('Try again') }
  }, [auth.accessToken, activeEvent, accentColor, showToast])

  const castVibe = useCallback(async (vibe: string) => {
    if (vibe === userVibe) return
    setUserVibe(vibe)
    if (vibe==='moment') { setMomentWave(true); if (momentTimer.current) clearTimeout(momentTimer.current); momentTimer.current = setTimeout(() => setMomentWave(false), 4000) }
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
      await fetch('/api/vote', { method:'POST', headers, body: JSON.stringify({ matchId: activeEvent.slug??activeEvent.id, vibe, prevVibe: userVibe }) })
    } catch {}
  }, [userVibe, auth.accessToken, activeEvent])

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, zIndex:20, padding:'10px 12px 0', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Row 1: logo + countdown pill */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff', fontFamily:"'Syne',sans-serif" }}>
            fanglobe<span style={{ color:accentColor }}>.live</span>
          </div>
          <ActiveMatchPill event={activeEvent} accentColor={accentColor} />
        </div>
        {/* Row 2: sport tabs */}
        <div style={{ display:'flex', gap:4, paddingBottom:10, overflowX:'auto', scrollbarWidth:'none' }}>
          {availableSports.map(s => {
            const cfg = SPORT_CONFIG[s]
            const isActive = s === activeSport
            const count = events.filter(e => e.sportId === s).length
            return (
              <button key={s} onClick={() => { onSwitchSport(s); const first = events.find(e => e.sportId===s); if (first) onSwitchEvent(first.slug??first.id) }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:100, border:'none', cursor:'pointer', flexShrink:0, transition:'all 0.15s',
                  background: isActive ? cfg.accent : 'rgba(255,255,255,0.07)',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
                }}>
                <span style={{ fontSize:13 }}>{cfg.emoji}</span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{cfg.short}</span>
                <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                  padding:'0 5px', borderRadius:100,
                  color: isActive ? '#000' : 'rgba(255,255,255,0.4)',
                }}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── GLOBE — middle, fills remaining space ───────────────────── */}
      <div style={{ flex:1, position:'relative', minHeight:0 }}>
        <GlobeComponent match={activeEvent} cities={snapshot?.cities??[]} userPin={userPin} newCheckinPos={newCheckinPos} momentWave={momentWave} />
        {/* Bottom fade */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'55%', background:'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)', pointerEvents:'none' }} />
        {/* Fan counter — sits in the fade zone */}
        <div style={{ position:'absolute', bottom:12, left:0, right:0, textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>
            <span style={{ color:accentColor }}>● </span>{countryCount} countries <span style={{ color:accentColor, marginLeft:6 }}>● </span>live
          </div>
          <div style={{ fontSize:46, fontWeight:800, letterSpacing:-2, lineHeight:1, fontFamily:"'JetBrains Mono',monospace", color:'#fff', textShadow:`0 0 40px ${accentColor}55` }}>
            {fmtFans(total)}
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:'2.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            fans watching {activeEvent.homeTeam.split(' ').slice(-1)[0]}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ─────────────────────────────────────────── */}
      <div style={{ flexShrink:0, background:'#080810', borderTop:'1px solid rgba(255,255,255,0.06)', paddingBottom:'env(safe-area-inset-bottom, 6px)' }}>

        {/* Drop pin */}
        <div style={{ padding:'10px 12px 6px' }}>
          <button onClick={handleCheckin} disabled={checkinLoading||hasCheckedIn} style={{
            width:'100%', background: hasCheckedIn ? 'rgba(255,255,255,0.05)' : accentColor,
            color: hasCheckedIn ? accentColor : '#000',
            border: hasCheckedIn ? `1px solid ${accentColor}44` : 'none',
            borderRadius:100, padding:'12px 0', fontSize:14, fontWeight:800,
            fontFamily:"'Syne',sans-serif", cursor:(checkinLoading||hasCheckedIn)?'default':'pointer',
            boxShadow: hasCheckedIn ? 'none' : `0 0 20px ${accentColor}44`,
            transition:'all 0.2s', opacity:checkinLoading?0.7:1,
          }}>
            {checkinLoading ? '📍 Locating...' : hasCheckedIn ? `✓ You're on the globe` : '📍 Drop my pin'}
          </button>
        </div>

        {/* Vibe buttons — compact 2×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, padding:'0 12px 6px' }}>
          {VIBE_CONFIG.map(v => {
            const voted = userVibe===v.key
            const count = pulse[v.key]??0
            return (
              <button key={v.key} onClick={() => castVibe(v.key)} style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                borderRadius:10, border:`1px solid ${voted ? v.color : 'rgba(255,255,255,0.07)'}`,
                background: voted ? `${v.color}14` : 'rgba(255,255,255,0.03)',
                cursor:'pointer', transition:'all 0.15s',
                transform: voted ? 'scale(1.02)' : 'scale(1)',
                boxShadow: voted ? `0 0 12px ${v.color}33` : 'none',
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{v.emoji}</span>
                <div style={{ textAlign:'left', minWidth:0 }}>
                  <div style={{ fontSize:9, fontWeight:700, color: voted ? v.color : 'rgba(255,255,255,0.38)', letterSpacing:'1px', fontFamily:"'Syne',sans-serif" }}>{v.label}</div>
                  <div style={{ fontSize:11, fontWeight:700, color: voted ? v.color : 'rgba(255,255,255,0.45)', fontFamily:"'JetBrains Mono',monospace" }}>{fmtFans(count)}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Pulse strip + schedule icon */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 12px 6px' }}>
          <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'2px', fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>PULSE</span>
          <div style={{ flex:1, height:4, borderRadius:100, overflow:'hidden', display:'flex', gap:1 }}>
            {VIBE_CONFIG.map(v => (
              <div key={v.key} style={{ width:`${Math.max(2,((pulse[v.key]??0)/totalPulse)*100)}%`, height:'100%', background:v.color, borderRadius:100, transition:'width 0.8s ease' }} />
            ))}
          </div>
          <MatchBrowser events={events} activeEventId={activeEvent.slug??activeEvent.id} onSelect={id => onSwitchEvent(id)} snapshots={snapshots} mobileInline />
        </div>
      </div>

      {toast && (
        <div style={{ position:'fixed', top:90, left:'50%', transform:'translateX(-50%)', background:accentColor, color:'#000', fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif", padding:'8px 20px', borderRadius:100, zIndex:30, whiteSpace:'nowrap', animation:'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}
      {showOnboarding && <OnboardingOverlay onDone={() => setShowOnboarding(false)} />}
      {showPickSide && <PickYourSide event={activeEvent} onPick={(side) => { if (pendingPin) commitCheckin(pendingPin.lat, pendingPin.lng, side) }} />}
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,6px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>
    </div>
  )
}