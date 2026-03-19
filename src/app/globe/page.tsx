'use client'
export const dynamic = 'force-dynamic'
import dynamicImport from 'next/dynamic'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { useSnapshot } from '@/hooks/useSnapshot'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import SportEventSwitcher from '@/components/SportEventSwitcher'
import PulseBar from '@/components/PulseBar'
import RivalrySplit from '@/components/RivalrySplit'
import MomentPulse from '@/components/MomentPulse'
import OnboardingOverlay from '@/components/OnboardingOverlay'
import PickYourSide from '@/components/PickYourSide'
import ShareCard from '@/components/ShareCard'
import LiveStatsTicker from '@/components/LiveStatsTicker'
import CityPopup from '@/components/CityPopup'
import type { CityData } from '@/types'

const GlobeComponent = dynamicImport(() => import('@/components/GlobeComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:52,height:52,borderRadius:'50%',border:'2px solid rgba(57,255,118,0.2)',borderTopColor:'#39ff76',animation:'spin 0.8s linear infinite',margin:'0 auto 20px' }} />
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'3px' }}>LOADING FANGLOBE</div>
      </div>
    </div>
  ),
})

function KickoffBadge({ kickoffAt, venue, homeTeam, awayTeam, homeFlag, awayFlag, homeColor, awayColor, accentColor }:
  { kickoffAt:string; venue:string; homeTeam:string; awayTeam:string; homeFlag:string; awayFlag:string; homeColor?:string; awayColor?:string; accentColor:string }) {
  const countdown = useCountdown(kickoffAt)
  const isLive = countdown === 'LIVE'
  return (
    <div style={{ position:'fixed',top:'var(--badge-top, 76px)',right:12,zIndex:20,background:'rgba(4,5,8,0.92)',border:`1px solid ${isLive ? accentColor.replace('1)','0.4)') : 'rgba(255,255,255,0.08)'}`,borderRadius:14,padding:'8px 12px',textAlign:'right',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',maxWidth:'42vw' }}>
      <div style={{ fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:5,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'1px',textTransform:'uppercase' }}>{venue}</div>
      {/* Team vs team */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',gap:6,marginBottom:6 }}>
        <span style={{ fontSize:11,fontWeight:700,color:homeColor ?? '#fff' }}>{homeFlag} {homeTeam.split(' ').slice(-1)[0]}</span>
        <span style={{ fontSize:9,color:'rgba(255,255,255,0.25)' }}>vs</span>
        <span style={{ fontSize:11,fontWeight:700,color:awayColor ?? '#fff' }}>{awayTeam.split(' ').slice(-1)[0]} {awayFlag}</span>
      </div>
      <div style={{ fontSize:20,fontWeight:700,letterSpacing:2,color:isLive ? accentColor : '#fff',fontFamily:"'JetBrains Mono',monospace",textShadow:isLive ? `0 0 16px ${accentColor.replace('1)','0.5)')}` : 'none' }}>{countdown}</div>
      <div style={{ fontSize:9,color:'rgba(255,255,255,0.22)',letterSpacing:'1.5px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>{isLive ? 'match in progress' : 'to kickoff'}</div>
    </div>
  )
}

// Compact leaderboard — closer to globe edge
function CompactLeaderboard({ cities, total, countryCount, accentColor }:
  { cities: CityData[]; total: number; countryCount: number; accentColor: string }) {
  const top = cities.slice(0, 7)
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n)
  const RANK_COLORS = ['#ffd166','rgba(200,200,200,0.55)','rgba(180,130,80,0.65)']
  return (
    <div className="desktop-only" style={{ position:'fixed',right:16,top:'50%',transform:'translateY(-50%)',background:'rgba(4,5,8,0.88)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'12px 13px',width:172,zIndex:20,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Top cities</span>
        <span style={{ fontSize:9,background:`${accentColor.replace('1)','0.12)')}`,color:accentColor,borderRadius:100,padding:'2px 6px',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,border:`1px solid ${accentColor.replace('1)','0.2)')}`}}>{total > 0 ? total.toLocaleString() : '—'}</span>
      </div>
      {top.map((c, i) => (
        <div key={c.city} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:i<top.length-1?8:0,paddingBottom:i<top.length-1?8:0,borderBottom:i<top.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
          <span style={{ fontSize:9,color:RANK_COLORS[i]??'rgba(255,255,255,0.18)',width:12,textAlign:'right',fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{i+1}</span>
          <span style={{ fontSize:12,flexShrink:0 }}>{c.flag}</span>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.8)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600 }}>{c.city}</span>
          <span style={{ fontSize:10,fontWeight:700,color:accentColor,whiteSpace:'nowrap',fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.count)}</span>
        </div>
      ))}
      <div style={{ marginTop:10,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between' }}>
        <span style={{ fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:"'JetBrains Mono',monospace" }}>{countryCount} countries</span>
        <span style={{ fontSize:9,color:accentColor,fontFamily:"'JetBrains Mono',monospace",display:'flex',alignItems:'center',gap:3 }}>
          <span style={{ width:4,height:4,borderRadius:'50%',background:accentColor,display:'inline-block',animation:'pip 2s infinite' }} />live
        </span>
      </div>
    </div>
  )
}

// Compact cheer feed — left side, closer to globe
function CompactCheerFeed({ cheers, sessionId, matchId, accentColor }:
  { cheers: import('@/types').Cheer[]; sessionId: string; matchId: string; accentColor: string }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/cheer/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ matchId, text: text.trim(), sessionId }) })
      setText(''); setShowInput(false)
    } catch { /* silent */ } finally { setSending(false) }
  }

  const VIBE_EMOJI: Record<string,string> = { fire:'🔥',ecstatic:'🎉',nervous:'😰',crushed:'💀',moment:'⚡' }

  return (
    <div className="desktop-only" style={{ position:'fixed',left:16,top:'50%',transform:'translateY(-50%)',width:180,zIndex:20 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.28)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Live cheers</span>
        <button onClick={() => setShowInput(v=>!v)} style={{ fontSize:9,fontWeight:700,color:accentColor,background:accentColor.replace('1)','0.1)'),border:`1px solid ${accentColor.replace('1)','0.2)')}`,borderRadius:100,padding:'2px 7px',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace" }}>
          {showInput ? '✕' : '+ add'}
        </button>
      </div>
      {showInput && (
        <div style={{ marginBottom:6,background:'rgba(4,5,8,0.9)',border:`1px solid ${accentColor.replace('1)','0.25)')}`,borderRadius:10,padding:9,backdropFilter:'blur(16px)' }}>
          <textarea value={text} onChange={e=>setText(e.target.value.slice(0,120))} placeholder="Your cheer..." rows={2}
            style={{ width:'100%',background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:11,resize:'none',fontFamily:"'Syne',sans-serif",lineHeight:1.4 }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:5 }}>
            <span style={{ fontSize:8,color:'rgba(255,255,255,0.2)',fontFamily:"'JetBrains Mono',monospace" }}>{text.length}/120</span>
            <button onClick={submit} disabled={sending||!text.trim()} style={{ fontSize:10,fontWeight:700,background:text.trim()?accentColor:'rgba(255,255,255,0.08)',color:text.trim()?'#000':'rgba(255,255,255,0.25)',border:'none',borderRadius:100,padding:'3px 10px',cursor:text.trim()?'pointer':'default',fontFamily:"'Syne',sans-serif" }}>
              {sending?'...':'Send'}
            </button>
          </div>
        </div>
      )}
      {cheers.slice(0,5).map((c,i) => (
        <div key={c.id} style={{ background:'rgba(4,5,8,0.82)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'7px 10px',marginBottom:i<4?5:0,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',animation:'slideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:2 }}>
            <span style={{ fontSize:10 }}>{c.flag}</span>
            <span style={{ fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:600,flex:1 }}>{c.city}</span>
            {c.vibe && <span style={{ fontSize:9 }}>{VIBE_EMOJI[c.vibe]??''}</span>}
          </div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.78)',lineHeight:1.3 }}>{c.text}</div>
        </div>
      ))}
    </div>
  )
}

export default function GlobePage() {
  const { events } = useEvents()
  const [activeEventId, setActiveEventId] = useState('')
  const [userPin, setUserPin] = useState<{lat:number;lng:number;color?:string}|null>(null)
  const [teamSide, setTeamSide] = useState<'home'|'away'|'neutral'|null>(null)
  const [userCity, setUserCity] = useState<string|undefined>()
  const [userRank, setUserRank] = useState<number|undefined>()
  const [newCheckinPos, setNewCheckinPos] = useState<{lat:number;lng:number}|null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [pendingPin, setPendingPin] = useState<{lat:number;lng:number}|null>(null)
  const [toast, setToast] = useState<string|null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPickSide, setShowPickSide] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityData|null>(null)
  const [momentWave, setMomentWave] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const momentTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const auth = useAuth()

  useEffect(() => {
    const done = localStorage.getItem('fg_onboarded')
    if (!done) setTimeout(() => setShowOnboarding(true), 900)
  }, [])

  const effectiveEventId = activeEventId || events[0]?.id || ''
  const activeEvent = events.find(e => e.id === effectiveEventId) ?? events[0]
  const sport = activeEvent?.sport
  const accentColor = sport ? sport.arcColor + '1)' : 'rgba(57,255,118,1)'
  const accentDim = sport ? sport.arcColor + '0.15)' : 'rgba(57,255,118,0.15)'

  // Team-specific accent: use home team color as primary when checked in
  const teamAccent = teamSide === 'home' && activeEvent?.homeColor
    ? activeEvent.homeColor
    : teamSide === 'away' && activeEvent?.awayColor
    ? activeEvent.awayColor
    : accentColor

  const { snapshot } = useSnapshot(effectiveEventId || null)
  const cheers = useRealtime(effectiveEventId || null)

  useEffect(() => {
    if (!snapshot || !userCity) return
    const rank = snapshot.cities.findIndex(c => c.city === userCity) + 1
    if (rank > 0) setUserRank(rank)
  }, [snapshot, userCity])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const handleSwitchEvent = useCallback((id: string) => {
    setActiveEventId(id)
    setHasCheckedIn(false)
    setTeamSide(null)
    setSelectedCity(null)
  }, [])

  const triggerMomentWave = useCallback(() => {
    setMomentWave(true)
    if (momentTimer.current) clearTimeout(momentTimer.current)
    momentTimer.current = setTimeout(() => setMomentWave(false), 4000)
  }, [])

  const handleCheckin = useCallback(async () => {
    if (checkinLoading || hasCheckedIn || !activeEvent) return
    if (auth.loading) { showToast('Just a sec...'); return }
    setCheckinLoading(true)
    const place = (lat: number, lng: number) => {
      setPendingPin({ lat, lng })
      setCheckinLoading(false)
      if (activeEvent.isRivalry) setShowPickSide(true)
      else commitCheckin(lat, lng, 'neutral')
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => place(p.coords.latitude, p.coords.longitude), () => place(36+Math.random()*10,-100+Math.random()*35))
    } else { place(36+Math.random()*10,-100+Math.random()*35) }
  }, [auth.loading, checkinLoading, hasCheckedIn, activeEvent, showToast])

  const commitCheckin = useCallback(async (lat: number, lng: number, side: 'home'|'away'|'neutral') => {
    setShowPickSide(false); setTeamSide(side)
    const pinColor = side === 'home' ? (activeEvent?.homeColor ?? accentColor)
      : side === 'away' ? (activeEvent?.awayColor ?? '#00d4ff')
      : 'rgba(255,255,255,0.95)'
    try {
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
      const res = await fetch('/api/checkin', { method:'POST', headers, body: JSON.stringify({ matchId: activeEvent?.id, lat, lng, teamSide: side }) })
      const data = await res.json()
      setUserPin({ lat, lng, color: pinColor })
      setNewCheckinPos({ lat, lng })
      setUserCity(data.city)
      setHasCheckedIn(true)
      showToast(data.city ? `You're on the globe — ${data.city}! 🌍` : "You're on the globe! 🌍")
      setTimeout(() => setNewCheckinPos(null), 200)
    } catch { showToast('Connection issue — try again') }
  }, [auth.accessToken, activeEvent, accentColor, showToast])

  const handlePickSide = useCallback((side: 'home'|'away'|'neutral') => {
    if (!pendingPin) return
    commitCheckin(pendingPin.lat, pendingPin.lng, side)
  }, [pendingPin, commitCheckin])

  const total = snapshot?.totalCount ?? 0
  const cities = snapshot?.cities ?? []
  const pulse = snapshot?.pulse ?? { fire:0,ecstatic:0,nervous:0,crushed:0,moment:0 }
  const countryCount = snapshot?.countryCount ?? 0
  const selectedCityRank = selectedCity ? cities.findIndex(c => c.city === selectedCity.city) + 1 : 0

  if (!activeEvent) return <div style={{ background:'#000',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.2)',fontFamily:'monospace',fontSize:11,letterSpacing:'2px' }}>LOADING...</div>

  return (
    <>
      {/* Scanlines */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:1,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)' }} />
      {/* Vignette */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:2,background:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.82) 100%)' }} />

      {/* Globe */}
      <div style={{ position:'absolute',inset:0 }}>
        <GlobeComponent
          match={activeEvent} cities={cities} userPin={userPin} newCheckinPos={newCheckinPos}
          onCityClick={(city) => setSelectedCity(city)}
          momentWave={momentWave}
        />
      </div>

      {/* Ticker */}
      <LiveStatsTicker snapshot={snapshot} event={activeEvent} accentColor={accentColor} />

      {/* Brand + passport link */}
      <div style={{ position:'fixed',top:18,left:20,zIndex:20,display:'flex',alignItems:'center',gap:8 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:accentColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'background 0.5s',boxShadow:`0 0 14px ${accentColor.replace('1)','0.4)')}` }}>
          {sport?.emoji ?? '🌍'}
        </div>
        <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.55)',fontFamily:"'Syne',sans-serif" }}>
          fanglobe<span style={{ color:accentColor }}>.live</span>
        </div>
        <a href="/passport" style={{ marginLeft:6,fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.3)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'0.5px',border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'2px 8px',transition:'all 0.15s' }}>
          🎫 Passport
        </a>
      </div>

      {/* Sport + event switcher */}
      <SportEventSwitcher events={events} activeEventId={effectiveEventId} onSelect={handleSwitchEvent} />

      {/* Kickoff badge with team names */}
      <KickoffBadge
        kickoffAt={activeEvent.kickoffAt} venue={activeEvent.venueShort}
        homeTeam={activeEvent.homeTeam} awayTeam={activeEvent.awayTeam}
        homeFlag={activeEvent.homeFlag} awayFlag={activeEvent.awayFlag}
        homeColor={activeEvent.homeColor} awayColor={activeEvent.awayColor}
        accentColor={accentColor}
      />

      {/* Rivalry split */}
      {snapshot && activeEvent.isRivalry && <RivalrySplit event={activeEvent} snapshot={snapshot} />}

      {/* RIGHT: Leaderboard */}
      <CompactLeaderboard cities={cities} total={total} countryCount={countryCount} accentColor={accentColor} />

      {/* LEFT: Cheer feed */}
      <CompactCheerFeed cheers={cheers} sessionId={auth.user?.id ?? ''} matchId={effectiveEventId} accentColor={accentColor} />

      {/* Moment pulse — wired to trigger wave */}
      <div style={{ position:'fixed',bottom:220,right:14,zIndex:20 }} onClick={triggerMomentWave}>
        <MomentPulse event={activeEvent} accessToken={auth.accessToken} />
      </div>

      {/* BOTTOM CENTER: Counter + CTA */}
      <div className="bottom-cta" style={{ position:'fixed',bottom:220,left:'50%',transform:'translateX(-50%)',textAlign:'center',zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
        <div style={{ display:'flex',gap:14 }}>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',fontFamily:"'JetBrains Mono',monospace",display:'flex',alignItems:'center',gap:4 }}>
            <div style={{ width:4,height:4,borderRadius:'50%',background:accentColor,animation:'pip 2s infinite' }} />{countryCount} countries
          </div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)',fontFamily:"'JetBrains Mono',monospace",display:'flex',alignItems:'center',gap:4 }}>
            <div style={{ width:4,height:4,borderRadius:'50%',background:accentColor,animation:'pip 2s infinite 0.7s' }} />live
          </div>
        </div>

        {/* Big counter with team color when checked in */}
        <div className="fan-counter" style={{ fontWeight:800,letterSpacing:-3,lineHeight:1,fontVariantNumeric:'tabular-nums',fontFamily:"'JetBrains Mono',monospace",textShadow:`0 0 50px ${teamAccent.includes('rgba') ? teamAccent.replace('1)','0.3)') : teamAccent+'55'}, 0 0 100px ${teamAccent.includes('rgba') ? teamAccent.replace('1)','0.1)') : teamAccent+'22'}`,color:'#fff',transition:'text-shadow 0.5s' }}>
          {total.toLocaleString()}
        </div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',letterSpacing:'3px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>
          fans watching {activeEvent.homeTeam.split(' ').slice(-1)[0]}
        </div>

        <div style={{ display:'flex',gap:8,marginTop:2 }}>
          <button onClick={handleCheckin} disabled={checkinLoading||hasCheckedIn}
            style={{ background:hasCheckedIn ? accentDim : accentColor, color:hasCheckedIn ? accentColor : '#000', border:hasCheckedIn ? `1px solid ${accentColor.replace('1)','0.3)')}` : 'none', borderRadius:100, padding:'11px 22px', fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif", cursor:(checkinLoading||hasCheckedIn)?'default':'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:hasCheckedIn?'none':`0 0 32px ${accentColor.replace('1)','0.4)')}`, transition:'all 0.2s', opacity:checkinLoading?0.7:1, pointerEvents:(checkinLoading||hasCheckedIn)?'none':'auto' }}>
            <span>{hasCheckedIn ? '✓' : auth.loading ? '⏳' : '📍'}</span>
            {checkinLoading ? 'Locating...' : hasCheckedIn ? "You're on the globe" : auth.loading ? 'Loading...' : 'Drop my pin'}
          </button>
          {hasCheckedIn && (
            <button onClick={() => setShowShareCard(true)} style={{ background:'transparent', border:`1px solid ${accentColor.replace('1)','0.3)')}`, borderRadius:100, padding:'11px 16px', fontSize:13, fontWeight:700, color:accentColor, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
              Share 🎴
            </button>
          )}
        </div>
      </div>

      {/* Pulse bar */}
      <PulseBar pulse={pulse} matchLabel={activeEvent.label} sessionId={auth.user?.id ?? ''} matchId={effectiveEventId} sport={sport} accessToken={auth.accessToken} />

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:74,left:'50%',transform:'translateX(-50%)',background:accentColor,color:'#000',fontSize:12,fontWeight:800,fontFamily:"'Syne',sans-serif",padding:'8px 20px',borderRadius:100,zIndex:30,pointerEvents:'none',whiteSpace:'nowrap',animation:'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}

      {/* Modals */}
      {showOnboarding && <OnboardingOverlay onDone={() => setShowOnboarding(false)} />}
      {showPickSide && activeEvent && <PickYourSide event={activeEvent} onPick={handlePickSide} />}
      {showShareCard && snapshot && <ShareCard event={activeEvent} snapshot={snapshot} userCity={userCity} userRank={userRank} onClose={() => setShowShareCard(false)} />}
      {selectedCity && <CityPopup city={selectedCity} event={activeEvent} cheers={cheers} rank={selectedCityRank} accentColor={accentColor} onClose={() => setSelectedCity(null)} />}
    </>
  )
}
