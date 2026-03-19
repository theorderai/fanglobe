'use client'
import dynamic from 'next/dynamic'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import PickYourSide from '@/components/PickYourSide'
import OnboardingOverlay from '@/components/OnboardingOverlay'
import MatchBrowser from '@/components/MatchBrowser'
import type { FanGlobeEvent, Snapshot, Cheer, Sport } from '@/types'

const GlobeComponent = dynamic(() => import('@/components/GlobeComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000' }}>
      <div style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(57,255,118,0.2)',borderTopColor:'#39ff76',animation:'spin 0.8s linear infinite' }} />
    </div>
  ),
})

interface Props {
  events: FanGlobeEvent[]
  activeEvent: FanGlobeEvent
  snapshot: Snapshot | null
  cheers: Cheer[]
  snapshots: Record<string, { totalCount: number; pulse: { fire:number;ecstatic:number;nervous:number;crushed:number;moment:number } }>
  onSwitchEvent: (id: string) => void
  accentColor: string
}

function SportTabBar({ events, activeEvent, accentColor, onSwitch }: {
  events: FanGlobeEvent[]; activeEvent: FanGlobeEvent; accentColor: string; onSwitch: (id: string) => void
}) {
  const sports = ['soccer','cricket','f1','nba'].filter(s => events.some(e => e.sportId === s))
  const sportEmoji: Record<string,string> = { soccer:'⚽', cricket:'🏏', f1:'🏎️', nba:'🏀' }
  const activeSport = activeEvent.sportId

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(4,5,8,0.9)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 100, padding: 3,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    }}>
      {sports.map(s => {
        const isActive = s === activeSport
        const sport = events.find(e => e.sportId === s)?.sport
        const accent = sport ? sport.arcColor + '1)' : accentColor
        const count = events.filter(e => e.sportId === s).length
        return (
          <button key={s} onClick={() => {
            const first = events.find(e => e.sportId === s)
            if (first) onSwitch(first.id)
          }} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            background: isActive ? accent : 'transparent',
            color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 13 }}>{sportEmoji[s]}</span>
            <span style={{ fontSize: 9, background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 100, padding: '1px 5px', color: isActive ? '#000' : 'rgba(255,255,255,0.3)' }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function ActiveMatchPill({ event, accentColor }: { event: FanGlobeEvent; accentColor: string }) {
  const countdown = useCountdown(event.kickoffAt)
  const isLive = countdown === 'LIVE'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(4,5,8,0.88)', border: `1px solid ${isLive ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 100, padding: '4px 10px',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0, boxShadow: '0 0 4px #dc2626' }} />}
      <span style={{ fontSize: 13 }}>{event.homeFlag}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'Syne',sans-serif" }}>
        {event.homeTeam.split(' ').slice(-1)[0]}
      </span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>vs</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'Syne',sans-serif" }}>
        {event.awayTeam.split(' ').slice(-1)[0]}
      </span>
      <span style={{ fontSize: 13 }}>{event.awayFlag}</span>
      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: isLive ? '#dc2626' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
        {isLive ? 'LIVE' : countdown.split(':').slice(0,2).join(':')}
      </span>
    </div>
  )
}

const VIBE_COLORS: Record<string, string> = {
  fire:'#ff6b35', ecstatic:'#ffd166', nervous:'#a78bfa', crushed:'#60a5fa', moment:'#39ff76'
}

export default function MobileGlobe({ events, activeEvent, snapshot, cheers, snapshots, onSwitchEvent, accentColor }: Props) {
  const auth = useAuth()
  const [userPin, setUserPin] = useState<{lat:number;lng:number;color?:string}|null>(null)
  const [newCheckinPos, setNewCheckinPos] = useState<{lat:number;lng:number}|null>(null)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [pendingPin, setPendingPin] = useState<{lat:number;lng:number}|null>(null)
  const [showPickSide, setShowPickSide] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [teamSide, setTeamSide] = useState<'home'|'away'|'neutral'|null>(null)
  const [userVibe, setUserVibe] = useState<string|null>(null)
  const [momentWave, setMomentWave] = useState(false)
  const [toast, setToast] = useState<string|null>(null)
  const momentTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (!localStorage.getItem('fg_onboarded')) setTimeout(() => setShowOnboarding(true), 900)
  }, [])

  if (!activeEvent) return null
  const sport = activeEvent.sport
  const total = snapshot?.totalCount ?? 0
  const pulse = snapshot?.pulse ?? { fire:0, ecstatic:0, nervous:0, crushed:0, moment:0 }
  const countryCount = snapshot?.countryCount ?? 0

  const vibes = sport?.vibes.filter(v => v.key !== 'moment') ?? [
    {key:'fire',emoji:'🔥',label:'Pumped'},
    {key:'ecstatic',emoji:'🎉',label:'Ecstatic'},
    {key:'nervous',emoji:'😰',label:'Nervous'},
    {key:'crushed',emoji:'💀',label:'Gutted'},
  ]

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const handleCheckin = useCallback(async () => {
    if (checkinLoading || hasCheckedIn || auth.loading) return
    setCheckinLoading(true)
    const place = (lat: number, lng: number) => {
      setPendingPin({ lat, lng })
      setCheckinLoading(false)
      if (activeEvent.isRivalry) setShowPickSide(true)
      else commitCheckin(lat, lng, 'neutral')
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => place(p.coords.latitude, p.coords.longitude),
        () => place(36+Math.random()*10, -100+Math.random()*35)
      )
    } else { place(36+Math.random()*10, -100+Math.random()*35) }
  }, [checkinLoading, hasCheckedIn, auth.loading, activeEvent])

  const commitCheckin = useCallback(async (lat: number, lng: number, side: 'home'|'away'|'neutral') => {
    setShowPickSide(false); setTeamSide(side)
    const pinColor = side === 'home' ? (activeEvent.homeColor ?? accentColor)
      : side === 'away' ? (activeEvent.awayColor ?? '#00d4ff') : 'rgba(255,255,255,0.95)'
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
      const res = await fetch('/api/checkin', { method:'POST', headers, body: JSON.stringify({ matchId: activeEvent.id, lat, lng, teamSide: side }) })
      const data = await res.json()
      setUserPin({ lat, lng, color: pinColor })
      setNewCheckinPos({ lat, lng })
      setHasCheckedIn(true)
      showToast(data.city ? `${data.flag ?? '📍'} ${data.city} is on the globe!` : "You're on the globe! 🌍")
      setTimeout(() => setNewCheckinPos(null), 200)
    } catch { showToast('Try again') }
  }, [auth.accessToken, activeEvent, accentColor, showToast])

  const castVibe = useCallback(async (vibe: string) => {
    if (vibe === userVibe) return
    setUserVibe(vibe)
    if (vibe === 'moment') { setMomentWave(true); if (momentTimer.current) clearTimeout(momentTimer.current); momentTimer.current = setTimeout(() => setMomentWave(false), 4000) }
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
      await fetch('/api/vote', { method:'POST', headers, body: JSON.stringify({ matchId: activeEvent.id, vibe, prevVibe: userVibe }) })
    } catch { /* silent */ }
  }, [userVibe, auth.accessToken, activeEvent])

  const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}K` : String(n)

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', overflow:'hidden' }}>
      {/* Globe — full screen */}
      <GlobeComponent match={activeEvent} cities={snapshot?.cities ?? []} userPin={userPin} newCheckinPos={newCheckinPos} momentWave={momentWave} />

      {/* Dark vignette bottom */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'45%', pointerEvents:'none', background:'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)', zIndex:5 }} />

      {/* TOP BAR */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, padding:'12px 12px 0', display:'flex', alignItems:'center', gap:8 }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:accentColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, boxShadow:`0 0 10px ${accentColor.replace('1)','0.4)')}` }}>
            {sport?.emoji ?? '🌍'}
          </div>
        </div>

        {/* Sport tabs — center */}
        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <SportTabBar events={events} activeEvent={activeEvent} accentColor={accentColor} onSwitch={onSwitchEvent} />
        </div>

        {/* Active match pill — right */}
        <ActiveMatchPill event={activeEvent} accentColor={accentColor} />
      </div>

      {/* BOTTOM SHEET — fixed, always visible */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:15, paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>

        {/* Fan counter + CTA */}
        <div style={{ textAlign:'center', paddingBottom:14 }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:4, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span><span style={{ color:accentColor }}>●</span> {countryCount} countries</span>
            <span><span style={{ color:accentColor }}>●</span> live</span>
          </div>
          <div style={{ fontSize:48, fontWeight:800, letterSpacing:-2, lineHeight:1, fontFamily:"'JetBrains Mono',monospace", color:'#fff', textShadow:`0 0 40px ${accentColor.replace('1)','0.3)')}` }}>
            {fmt(total)}
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            fans watching
          </div>

          {/* Drop pin / checked in */}
          <button onClick={handleCheckin} disabled={checkinLoading || hasCheckedIn}
            style={{ background: hasCheckedIn ? 'rgba(255,255,255,0.08)' : accentColor, color: hasCheckedIn ? accentColor : '#000', border: hasCheckedIn ? `1px solid ${accentColor.replace('1)','0.3)')}` : 'none', borderRadius:100, padding:'12px 28px', fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", cursor:(checkinLoading||hasCheckedIn)?'default':'pointer', boxShadow:hasCheckedIn?'none':`0 0 30px ${accentColor.replace('1)','0.5)')}`, transition:'all 0.2s', opacity:checkinLoading?0.7:1 }}>
            {checkinLoading ? '📍 Locating...' : hasCheckedIn ? '✓ On the globe' : '📍 Drop my pin'}
          </button>
        </div>

        {/* Vibe buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, padding:'0 10px 8px' }}>
          {vibes.slice(0,4).map(v => {
            const voted = userVibe === v.key
            const vc = VIBE_COLORS[v.key] ?? '#fff'
            const count = pulse[v.key] ?? 0
            return (
              <button key={v.key} onClick={() => castVibe(v.key)} style={{ background: voted ? 'rgba(255,255,255,0.1)' : 'rgba(4,5,8,0.85)', border:`1px solid ${voted ? vc : 'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'9px 4px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, backdropFilter:'blur(10px)', transform:voted?'scale(1.04)':'none', boxShadow:voted?`0 0 14px ${vc}55`:'none', transition:'all 0.15s' }}>
                <span style={{ fontSize:20 }}>{v.emoji}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.3px', fontFamily:"'Syne',sans-serif" }}>{v.label.toUpperCase()}</span>
                <span style={{ fontSize:11, fontWeight:700, color: voted ? vc : 'rgba(255,255,255,0.6)', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(count)}</span>
              </button>
            )
          })}
        </div>

        {/* Pulse bar — compact strip */}
        <div style={{ background:'rgba(4,5,8,0.88)', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'8px 14px 10px', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>PULSE</span>
          <div style={{ flex:1, height:5, borderRadius:100, overflow:'hidden', display:'flex', gap:1 }}>
            {vibes.map(v => {
              const vc = VIBE_COLORS[v.key] ?? '#fff'
              const total_ = Math.max(1, vibes.reduce((s,vv) => s+(pulse[vv.key]??0), 0))
              const pct = Math.max(2, ((pulse[v.key]??0) / total_) * 100)
              return <div key={v.key} style={{ width:`${pct}%`, height:'100%', borderRadius:100, background:vc, transition:'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
            })}
          </div>
          {/* Match schedule button */}
          <MatchBrowser events={events} activeEventId={activeEvent.id} onSelect={(id) => { onSwitchEvent(id) }} snapshots={snapshots} mobileInline />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', background:accentColor, color:'#000', fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif", padding:'8px 20px', borderRadius:100, zIndex:30, whiteSpace:'nowrap', animation:'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}

      {showOnboarding && <OnboardingOverlay onDone={() => setShowOnboarding(false)} />}
      {showPickSide && <PickYourSide event={activeEvent} onPick={(side) => { if (pendingPin) commitCheckin(pendingPin.lat, pendingPin.lng, side) }} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,6px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>
    </div>
  )
}