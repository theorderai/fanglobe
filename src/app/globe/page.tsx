'use client'
export const dynamic = 'force-dynamic'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import nextDynamic from 'next/dynamic'
import { useEvents } from '@/hooks/useEvents'
import { useSnapshot } from '@/hooks/useSnapshot'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { useIsMobile } from '@/hooks/useIsMobile'
import OnboardingOverlay from '@/components/OnboardingOverlay'
import PickYourSide from '@/components/PickYourSide'
import ShareCard from '@/components/ShareCard'
import CityPopup from '@/components/CityPopup'
import MatchBrowser from '@/components/MatchBrowser'
import { getExpectedReach, GLOBAL_FANS_TRACKED } from '@/lib/events'
import EmailCaptureModal from '@/components/EmailCaptureModal'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { CityData, FanGlobeEvent } from '@/types'

const GlobeComponent = nextDynamic(() => import('@/components/GlobeComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000' }}>
      <div style={{ width:44,height:44,borderRadius:'50%',border:'2px solid rgba(57,255,118,0.15)',borderTopColor:'#39ff76',animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  ),
})

// ── Constants ──────────────────────────────────────────────────────────────────
const SPORTS: Record<string, { name:string; short:string; emoji:string; accent:string }> = {
  soccer:  { name:'Football',  short:'Football',  emoji:'⚽', accent:'#39FF76' },
  cricket: { name:'Cricket',   short:'Cricket',   emoji:'🏏', accent:'#00B4FF' },
  f1:      { name:'Formula 1', short:'F1',        emoji:'🏎️', accent:'#DC2626' },
  nba:     { name:'NBA',       short:'NBA',       emoji:'🏀', accent:'#EA580C' },
}
const VIBES = [
  { key:'fire',     label:'Pumped',   color:'#ff6b35' },
  { key:'ecstatic', label:'Ecstatic', color:'#ffd166' },
  { key:'nervous',  label:'Nervous',  color:'#a78bfa' },
  { key:'crushed',  label:'Gutted',   color:'#60a5fa' },
]
function fmt(n: number) {
  if (n>=1e6) return `${(n/1e6).toFixed(1)}M`
  if (n>=1e3) return `${Math.round(n/1e3)}K`
  return String(n)
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActiveMatchPill({ event, accent }: { event: FanGlobeEvent; accent: string }) {
  const cd = useCountdown(event.kickoffAt)
  const live = cd === 'LIVE'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(0,0,0,0.6)',border:`1px solid ${live?'rgba(220,38,38,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:100,padding:'4px 10px',backdropFilter:'blur(12px)',flexShrink:0 }}>
      {live && <span style={{ width:5,height:5,borderRadius:'50%',background:'#dc2626',boxShadow:'0 0 4px #dc2626',flexShrink:0 }} />}
      <span style={{ fontSize:13 }}>{event.homeFlag}</span>
      <span style={{ fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:live?'#dc2626':'rgba(255,255,255,0.5)',fontWeight:700 }}>
        {live ? 'LIVE' : cd.split(':').slice(0,2).join(':')}
      </span>
      <span style={{ fontSize:13 }}>{event.awayFlag}</span>
    </div>
  )
}

function SportTabs({ events, activeSport, accent, onSwitch, onSelectFirst, onMobileTap, isMobile }: {
  events: FanGlobeEvent[]; activeSport: string; accent: string
  onSwitch: (s:string) => void; onSelectFirst: (s:string) => void
  onMobileTap?: (s:string) => void; isMobile?: boolean | null
}) {
  const available = Object.keys(SPORTS).filter(s => events.some(e => e.sportId===s))
  return (
    <div style={{ display:'flex',gap:4,overflowX:'auto',scrollbarWidth:'none' }}>
      {available.map(s => {
        const cfg = SPORTS[s]
        const active = s === activeSport
        const count = events.filter(e => e.sportId===s).length
        return (
          <button key={s} onClick={() => {
            onSwitch(s); onSelectFirst(s)
            // On mobile, tapping a sport tab opens the match browser for that sport
            if (isMobile && onMobileTap) onMobileTap(s)
          }} style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:100,border:'none',cursor:'pointer',flexShrink:0,transition:'all 0.15s',
            background: active ? cfg.accent : 'rgba(255,255,255,0.08)',
            color: active ? '#000' : 'rgba(255,255,255,0.5)',
          }}>
            <span style={{ fontSize:13 }}>{cfg.emoji}</span>
            <span style={{ fontSize:11,fontWeight:700,fontFamily:"'Syne',sans-serif" }}>{cfg.short}</span>
            <span style={{ fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:active?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.1)',padding:'0 5px',borderRadius:100,color:active?'#000':'rgba(255,255,255,0.4)' }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function VibeMeter({ pulse, userVibe, accent, onVote }: {
  pulse: Record<string,number>; userVibe: string|null; accent: string; onVote: (v:string)=>void
}) {
  const total = Math.max(1, VIBES.reduce((s,v) => s+(pulse[v.key]??0), 0))
  const hasVotes = total > 1
  return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4 }}>
      {VIBES.map(v => {
        const voted = userVibe===v.key
        const pct = hasVotes ? Math.round(((pulse[v.key]??0)/total)*100) : null
        return (
          <button key={v.key} onClick={() => onVote(v.key)} style={{
            position:'relative',overflow:'hidden',
            display:'flex',flexDirection:'column',alignItems:'flex-start',gap:1,
            padding:'8px 10px 7px',borderRadius:10,
            border:`1px solid ${voted ? v.color+'77' : 'rgba(255,255,255,0.07)'}`,
            background: voted ? `${v.color}12` : 'rgba(255,255,255,0.02)',
            cursor:'pointer',transition:'all 0.12s',
          }}>
            <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:voted?v.color:'rgba(255,255,255,0.07)',borderRadius:'10px 10px 0 0',transition:'background 0.2s' }} />
            <span style={{ fontSize:9,fontWeight:700,color:voted?v.color:'rgba(255,255,255,0.38)',letterSpacing:'1px',fontFamily:"'Syne',sans-serif",marginTop:3,textTransform:'uppercase' }}>{v.label}</span>
            <span style={{ fontSize:15,fontWeight:800,color:voted?'#fff':'rgba(255,255,255,0.55)',fontFamily:"'JetBrains Mono',monospace",lineHeight:1.1 }}>
              {pct !== null ? `${pct}%` : '—'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FanCounter({ total, countryCount, teamName, accent, fas, expectedReach }: {
  total:number; countryCount:number; teamName:string; accent:string
  fas?: { score:number; label:string; color:string }
  expectedReach?: number
}) {
  // Warm start: if real data is thin, show expected reach with clear label
  const isPreMatch = total < 1000
  const displayNumber = isPreMatch && expectedReach ? expectedReach : total
  const isExpected = isPreMatch && !!expectedReach

  return (
    <div style={{ textAlign:'center' }}>
      {/* Global community warm-start banner */}
      {total === 0 && (
        <div style={{ fontSize:9,color:'rgba(255,255,255,0.25)',letterSpacing:'1.5px',fontFamily:"'JetBrains Mono',monospace",marginBottom:6 }}>
          <span style={{ color:accent }}>● </span>{fmt(GLOBAL_FANS_TRACKED)}+ fans tracked across all matches
        </div>
      )}
      <div style={{ fontSize:9,color:'rgba(255,255,255,0.35)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",marginBottom:2 }}>
        {isExpected
          ? <><span style={{ color:accent }}>● </span>expected reach</>
          : <><span style={{ color:accent }}>● </span>{countryCount} countries<span style={{ margin:'0 8px',opacity:0.4 }}>·</span><span style={{ color:accent }}>● </span>live</>
        }
      </div>
      <div style={{ fontSize:'clamp(32px,8vw,56px)',fontWeight:800,letterSpacing:-2,lineHeight:1,fontFamily:"'JetBrains Mono',monospace",color: isExpected ? 'rgba(255,255,255,0.45)' : '#fff',textShadow:`0 0 40px ${accent}${isExpected ? '22' : '44'}` }}>
        {fmt(displayNumber)}
      </div>
      <div style={{ fontSize:9,color:'rgba(255,255,255,0.28)',letterSpacing:'2.5px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",marginTop:2 }}>
        {isExpected ? `fans expected for ${teamName}` : `fans watching ${teamName}`}
      </div>
      {fas && fas.score > 0 && !isExpected && (
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginTop:8,background:'rgba(255,255,255,0.05)',border:`1px solid ${fas.color}33`,borderRadius:100,padding:'4px 12px' }}>
          <span style={{ fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'1px' }}>FAS</span>
          <span style={{ fontSize:16,fontWeight:800,color:fas.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1 }}>{fas.score}</span>
          <span style={{ fontSize:9,fontWeight:700,color:fas.color,letterSpacing:'0.5px' }}>{fas.label.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}

function LiveCheers({ cheers, sessionId, matchId, accent }: { cheers: any[]; sessionId:string; matchId:string; accent:string }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const submit = async () => {
    if (!text.trim()||sending) return
    setSending(true)
    try { await fetch('/api/cheer/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId,text:text.trim(),sessionId})}); setText(''); setOpen(false) }
    catch {}
    finally { setSending(false) }
  }
  return (
    <div style={{ position:'fixed',left:16,top:90,bottom:180,zIndex:20,width:180,display:'flex',flexDirection:'column',gap:6,overflowY:'hidden' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Live Cheers</span>
        <button onClick={()=>setOpen(o=>!o)} style={{ fontSize:9,fontWeight:700,color:accent,background:`${accent}18`,border:`1px solid ${accent}33`,borderRadius:100,padding:'2px 8px',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace" }}>{open?'✕':'+ add'}</button>
      </div>
      {open && (
        <div style={{ background:'rgba(4,5,8,0.92)',border:`1px solid ${accent}33`,borderRadius:10,padding:9,marginBottom:4 }}>
          <textarea value={text} onChange={e=>setText(e.target.value.slice(0,120))} placeholder="Your cheer…" rows={2}
            style={{ width:'100%',background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:11,resize:'none',fontFamily:"'Syne',sans-serif",lineHeight:1.4 }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4 }}>
            <span style={{ fontSize:8,color:'rgba(255,255,255,0.2)',fontFamily:"'JetBrains Mono',monospace" }}>{text.length}/120</span>
            <button onClick={submit} disabled={sending||!text.trim()} style={{ fontSize:10,fontWeight:700,background:text.trim()?accent:'rgba(255,255,255,0.06)',color:text.trim()?'#000':'rgba(255,255,255,0.2)',border:'none',borderRadius:100,padding:'3px 10px',cursor:text.trim()?'pointer':'default',fontFamily:"'Syne',sans-serif" }}>{sending?'…':'Send'}</button>
          </div>
        </div>
      )}
      {cheers.slice(0,5).map((c,i) => (
        <div key={c.id??i} style={{ background:'rgba(4,5,8,0.8)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'7px 10px',backdropFilter:'blur(12px)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:2 }}>
            <span style={{ fontSize:10 }}>{c.flag}</span>
            <span style={{ fontSize:9,color:'rgba(255,255,255,0.3)',fontWeight:600,flex:1 }}>{c.city}</span>
          </div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.75)',lineHeight:1.3 }}>{c.text}</div>
        </div>
      ))}
    </div>
  )
}

function TopCities({ cities, total, countryCount, accent }: { cities:CityData[]; total:number; countryCount:number; accent:string }) {
  const RANK = ['#ffd166','rgba(200,200,200,0.5)','rgba(180,130,80,0.6)']
  return (
    <div style={{ position:'fixed',right:16,top:90,zIndex:20,background:'rgba(4,5,8,0.88)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'12px 14px',width:176,backdropFilter:'blur(20px)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.28)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Top Cities</span>
        <span style={{ fontSize:9,background:`${accent}18`,color:accent,borderRadius:100,padding:'2px 7px',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,border:`1px solid ${accent}22` }}>{total>0?fmt(total):'—'}</span>
      </div>
      {cities.slice(0,7).map((c,i) => (
        <div key={c.city} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:i<6?7:0,paddingBottom:i<6?7:0,borderBottom:i<6?'1px solid rgba(255,255,255,0.04)':'none' }}>
          <span style={{ fontSize:9,color:RANK[i]??'rgba(255,255,255,0.15)',width:12,textAlign:'right',fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{i+1}</span>
          <span style={{ fontSize:12,flexShrink:0 }}>{c.flag}</span>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.8)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600 }}>{c.city}</span>
          <span style={{ fontSize:10,fontWeight:700,color:accent,fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{fmt(c.count)}</span>
        </div>
      ))}
      <div style={{ marginTop:8,paddingTop:7,borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between' }}>
        <span style={{ fontSize:9,color:'rgba(255,255,255,0.18)',fontFamily:"'JetBrains Mono',monospace" }}>{countryCount} countries</span>
        <span style={{ fontSize:9,color:accent,fontFamily:"'JetBrains Mono',monospace" }}>● live</span>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GlobePage() {
  const { events, activeEvents, activeSport, switchSport } = useEvents()
  const isMobile = useIsMobile()
  const auth = useAuth()

  const [activeEventId, setActiveEventId] = useState('')
  const effectiveId = activeEventId || events[0]?.slug || events[0]?.id || ''
  const [userPin, setUserPin] = useState<{lat:number;lng:number;color?:string}|null>(null)
  const [newCheckinPos, setNewCheckinPos] = useState<{lat:number;lng:number}|null>(null)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [pendingPin, setPendingPin] = useState<{lat:number;lng:number}|null>(null)
  const [userVibe, setUserVibe] = useState<string|null>(null)
  const [toast, setToast] = useState<string|null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPickSide, setShowPickSide] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityData|null>(null)
  const [snapshots, setSnapshots] = useState<Record<string,{totalCount:number;pulse:{fire:number;ecstatic:number;nervous:number;crushed:number;moment:number}}>>({})
  const [matchBrowserSport, setMatchBrowserSport] = useState<string|null>(null)
  const push = usePushNotifications(auth.user?.id ?? 'anon', undefined)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [userCityRank, setUserCityRank] = useState<number>(0)
  const [userCityData, setUserCityData] = useState<{city:string;country:string;flag:string}|null>(null)
  const [captchaToken, setCaptchaToken] = useState<string|null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  const activeEvent = events.find(e=>(e.slug??e.id)===effectiveId) ?? events[0]
  const sportCfg = activeEvent ? SPORTS[activeEvent.sportId] : SPORTS.soccer
  const accent = sportCfg?.accent ?? '#39FF76'

  const { snapshot } = useSnapshot(effectiveId || null)
  const cheers = useRealtime(effectiveId || null)
  const total = snapshot?.totalCount ?? 0
  const cities = snapshot?.cities ?? []
  const pulse: Record<string,number> = snapshot?.pulse ?? {}
  const countryCount = snapshot?.countryCount ?? 0

  // Persist pin across refreshes
  const STORAGE_KEY = activeEvent ? `fg_pin_${activeEvent.slug??activeEvent.id}` : null
  useEffect(() => {
    if (!STORAGE_KEY) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { const p = JSON.parse(saved); setUserPin(p); setHasCheckedIn(true) }
      else { setUserPin(null); setHasCheckedIn(false) }
    } catch {}
  }, [STORAGE_KEY])

  useEffect(() => {
    if (!localStorage.getItem('fg_onboarded')) setTimeout(()=>setShowOnboarding(true),900)
  }, [])

  // One-time prefetch for match browser fan counts — max 4, no polling
  useEffect(() => {
    if (!events.length) return
    events.filter(e=>e.isFeatured).slice(0,4).forEach(ev => {
      const key = ev.slug ?? ev.id
      fetch(`/api/snapshot/${key}`, { cache:'force-cache' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.totalCount !== undefined)
            setSnapshots(p => ({ ...p, [key]: { totalCount: d.totalCount, pulse: { fire:d.pulse?.fire??0, ecstatic:d.pulse?.ecstatic??0, nervous:d.pulse?.nervous??0, crushed:d.pulse?.crushed??0, moment:d.pulse?.moment??0 } } }))
        }).catch(() => {})
    })
  }, [events.length])

  const showToast = useCallback((msg:string) => {
    setToast(msg); if(toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(()=>setToast(null),3000)
  }, [])

  const handleSwitchEvent = useCallback((id:string) => {
    setActiveEventId(id); setHasCheckedIn(false); setUserVibe(null); setSelectedCity(null)
  }, [])

  const handleSwitchSportFirst = useCallback((s:string) => {
    const first = events.find(e=>e.sportId===s); if(first) handleSwitchEvent(first.slug??first.id)
  }, [events, handleSwitchEvent])

  const handleCheckin = useCallback(async () => {
    if (checkinLoading||hasCheckedIn||!activeEvent) return
    setCheckinLoading(true)
    // Verify hCaptcha if token present
    if (captchaToken) {
      try {
        const vRes = await fetch('/api/captcha/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: captchaToken }) })
        const vData = await vRes.json()
        if (!vData.success) { showToast('Verification failed — try again'); setCheckinLoading(false); return }
      } catch { /* bypass on network error */ }
    }
    const place = (lat:number,lng:number) => {
      setPendingPin({lat,lng}); setCheckinLoading(false)
      if (activeEvent.isRivalry) setShowPickSide(true); else commitCheckin(lat,lng,'neutral')
    }
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(p=>place(p.coords.latitude,p.coords.longitude),()=>place(36+Math.random()*10,-100+Math.random()*35)) }
    else place(36+Math.random()*10,-100+Math.random()*35)
  }, [checkinLoading,hasCheckedIn,activeEvent])

  const commitCheckin = useCallback(async (lat:number,lng:number,side:'home'|'away'|'neutral') => {
    if (!activeEvent) return
    setShowPickSide(false)
    const color = side==='home'?(activeEvent.homeColor??accent):side==='away'?(activeEvent.awayColor??'#00d4ff'):'rgba(255,255,255,0.9)'
    try {
      const headers:Record<string,string> = {'Content-Type':'application/json'}
      if(auth.accessToken) headers['Authorization']=`Bearer ${auth.accessToken}`
      const res = await fetch('/api/checkin',{method:'POST',headers,body:JSON.stringify({matchId:activeEvent?.slug??activeEvent?.id,lat,lng,teamSide:side})})
      const data = await res.json()
      const pin = {lat,lng,color}
      setUserPin(pin); setNewCheckinPos({lat,lng}); setHasCheckedIn(true)
      if(STORAGE_KEY) try{localStorage.setItem(STORAGE_KEY,JSON.stringify(pin))}catch{}
      showToast(data.city?`${data.flag??'📍'} ${data.city} is on the globe!`:"You're on the globe! 🌍")
      setTimeout(()=>setNewCheckinPos(null),200)
      // Show email capture at emotional peak — after checkin confirmed
      if (data.city) {
        const rank = cities.findIndex((c: {city:string}) => c.city === data.city) + 1
        setUserCityData({ city: data.city, country: data.country ?? '', flag: data.flag ?? '📍' })
        setUserCityRank(rank || 1)
        setTimeout(() => setShowEmailModal(true), 1500)
      }
    } catch { showToast('Try again') }
  }, [auth.accessToken,activeEvent,accent,STORAGE_KEY,showToast])

  const castVibe = useCallback(async (vibe:string) => {
    if(vibe===userVibe) return; setUserVibe(vibe)
    try {
      const headers:Record<string,string> = {'Content-Type':'application/json'}
      if(auth.accessToken) headers['Authorization']=`Bearer ${auth.accessToken}`
      await fetch('/api/vote',{method:'POST',headers,body:JSON.stringify({matchId:activeEvent?.slug??activeEvent?.id,vibe,prevVibe:userVibe})})
    } catch {}
  }, [userVibe,auth.accessToken,activeEvent])

  if (isMobile === null) return (
    <div style={{ background:'#000',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ width:44,height:44,borderRadius:'50%',border:'2px solid rgba(57,255,118,0.15)',borderTopColor:'#39ff76',animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!activeEvent) return null

  const teamName = activeEvent.homeTeam.split(' ').slice(-1)[0]
  const accentDim = `${accent}22`

  return (
    <div style={{ position:'fixed',inset:0,background:'#000',display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{ flexShrink:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',zIndex:30 }}>
        {isMobile ? (
          /* Mobile: row1 = logo + pill, row2 = sport tabs */
          <>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px 6px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,boxShadow:`0 0 12px ${accent}44`,transition:'background 0.4s',flexShrink:0 }}>{sportCfg?.emoji??'🌍'}</div>
                <span style={{ fontSize:13,fontWeight:800,color:'#fff',fontFamily:"'Syne',sans-serif" }}>fanglobe<span style={{ color:accent }}>.live</span></span>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                {push.state !== 'unsupported' && push.state !== 'granted' && (
                  <button onClick={push.subscribe} disabled={push.loading} title="Get match notifications" style={{ background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:push.loading?0.5:1 }}>🔔</button>
                )}
                <details style={{ position:'relative',flexShrink:0 }}>
                  <summary style={{ listStyle:'none',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>⋯</summary>
                  <div style={{ position:'absolute',top:34,right:0,zIndex:40,background:'rgba(4,5,10,0.96)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:6,minWidth:170,boxShadow:'0 20px 50px rgba(0,0,0,0.7)' }}>
                    <a href="/leaderboard" style={{ display:'block',padding:'8px 12px',borderRadius:8,color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>🏆 Leaderboard</a>
                    <a href="/fas/weekly" style={{ display:'block',padding:'8px 12px',borderRadius:8,color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>⚡ FAS Weekly</a>
                    <a href="/fas" style={{ display:'block',padding:'8px 12px',borderRadius:8,color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>📊 What is FAS?</a>
                    <a href="/passport" style={{ display:'block',padding:'8px 12px',borderRadius:8,color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>🎫 Passport</a>
                    <a href="/india-pakistan" style={{ display:'block',padding:'8px 12px',borderRadius:8,color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>🏏 India vs Pakistan</a>
                  </div>
                </details>
                {push.state === 'granted' && (
                  <div style={{ width:6,height:6,borderRadius:'50%',background:accent,boxShadow:`0 0 6px ${accent}` }} title="Notifications on" />
                )}
                <ActiveMatchPill event={activeEvent} accent={accent} />
                </div>
              </div>
            </div>
            <div style={{ padding:'0 12px 6px' }}>
              <SportTabs events={events} activeSport={activeSport} accent={accent} onSwitch={switchSport} onSelectFirst={handleSwitchSportFirst} isMobile={isMobile} onMobileTap={(s) => setMatchBrowserSport(s)} />
            </div>
            {/* Mobile: next match preview strip — tap to open full schedule */}
            <div style={{ display:'flex',gap:6,padding:'0 12px 8px',overflowX:'auto',scrollbarWidth:'none',alignItems:'center' }}>
              {events.filter(e => e.sportId === activeSport).slice(0,6).map(ev => {
                const id = ev.slug??ev.id
                const active = id===effectiveId
                const mo = new Date(ev.kickoffAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})
                return (
                  <button key={id} onClick={() => handleSwitchEvent(id)} style={{
                    display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:100,border:`1px solid ${active?accent+'55':'rgba(255,255,255,0.08)'}`,cursor:'pointer',flexShrink:0,transition:'all 0.15s',
                    background:active?`${accent}18`:'rgba(255,255,255,0.03)',
                    color:active?accent:'rgba(255,255,255,0.45)',
                  }}>
                    <span style={{ fontSize:11 }}>{ev.homeFlag}</span>
                    <span style={{ fontSize:10,fontWeight:active?700:400,fontFamily:"'Syne',sans-serif" }}>{ev.homeTeam.split(' ').slice(-1)[0]} v {ev.awayTeam.split(' ').slice(-1)[0]}</span>
                    <span style={{ fontSize:11 }}>{ev.awayFlag}</span>
                    <span style={{ fontSize:9,opacity:0.35,fontFamily:"'JetBrains Mono',monospace" }}>{mo}</span>
                  </button>
                )
              })}
              <button onClick={() => setMatchBrowserSport(activeSport)} style={{ display:'flex',alignItems:'center',gap:3,padding:'4px 9px',borderRadius:100,border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',flexShrink:0,background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.35)' }}>
                <span style={{ fontSize:9,fontFamily:"'JetBrains Mono',monospace" }}>All ›</span>
              </button>
            </div>
          </>
        ) : (
          /* Desktop: single row = logo + sport tabs + pill */
          <>
            <div style={{ display:'flex',alignItems:'center',padding:'8px 20px 6px' }}>
              {/* Logo — left */}
              <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,boxShadow:`0 0 12px ${accent}44`,transition:'background 0.4s' }}>{sportCfg?.emoji??'🌍'}</div>
                <span style={{ fontSize:13,fontWeight:800,color:'#fff',fontFamily:"'Syne',sans-serif" }}>fanglobe<span style={{ color:accent }}>.live</span></span>
                <div style={{ display:'flex',alignItems:'center',gap:4,marginLeft:6 }}>
                  <a href="/leaderboard" style={{ fontSize:9,color:'rgba(255,255,255,0.4)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'3px 9px',whiteSpace:'nowrap' }}>🏆 Leaderboard</a>
                  <a href="/fas/weekly" style={{ fontSize:9,color:'rgba(255,255,255,0.4)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'3px 9px',whiteSpace:'nowrap' }}>⚡ FAS Weekly</a>
                  <a href="/passport" style={{ fontSize:9,color:'rgba(255,255,255,0.4)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'3px 9px',whiteSpace:'nowrap' }}>🎫 Passport</a>
                </div>
              </div>
              {/* Sport tabs — centered */}
              <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
                <SportTabs events={events} activeSport={activeSport} accent={accent} onSwitch={switchSport} onSelectFirst={handleSwitchSportFirst} />
              </div>
              {/* Countdown — right */}
              <ActiveMatchPill event={activeEvent} accent={accent} />
            </div>
            {/* Event strip — centered */}
            <div style={{ display:'flex',justifyContent:'center',padding:'0 20px 8px' }}>
              <DesktopEventStrip events={activeEvents} activeId={effectiveId} accent={accent} onSelect={handleSwitchEvent} />
            </div>
          </>
        )}
      </div>

      {/* ── GLOBE ──────────────────────────────────────────────── */}
      <div style={{ flex:1,position:'relative',minHeight:0 }}>
        <GlobeComponent match={activeEvent} cities={cities} userPin={userPin} newCheckinPos={newCheckinPos} momentWave={false} onCityClick={isMobile?undefined:(city: CityData)=>setSelectedCity(city)} />

        {/* Desktop: side panels — fixed position, render after globe */}
      </div>

      {/* Desktop side panels */}
      {!isMobile && <LiveCheers cheers={cheers} sessionId={auth.user?.id??''} matchId={effectiveId} accent={accent} />}
      {!isMobile && <TopCities cities={cities} total={total} countryCount={countryCount} accent={accent} />}

      {/* ── BOTTOM PANEL ───────────────────────────────────────── */}
      <div style={{ flexShrink:0,background:'#080810',borderTop:'1px solid rgba(255,255,255,0.06)',padding:`8px ${isMobile?'12px':'20%'} env(safe-area-inset-bottom,6px)` }}>
        {/* Fan counter */}
        <FanCounter total={total} countryCount={countryCount} teamName={teamName} accent={accent} fas={snapshot?.fas} expectedReach={getExpectedReach(effectiveId)} />

        {/* CTA */}
        <div style={{ margin:'8px 0 6px' }}>
          <div style={{ display:'flex',gap:8,justifyContent:'center',alignItems:'center' }}>
            <button onClick={handleCheckin} disabled={checkinLoading||hasCheckedIn} style={{
              flex:1, maxWidth:340, background:hasCheckedIn?accentDim:accent,
              color:hasCheckedIn?accent:'#000', border:hasCheckedIn?`1px solid ${accent}44`:'none',
              borderRadius:100, padding:'11px 0', fontSize:14, fontWeight:800,
              fontFamily:"'Syne',sans-serif", cursor:(checkinLoading||hasCheckedIn)?'default':'pointer',
              boxShadow:hasCheckedIn?'none':`0 0 24px ${accent}44`, transition:'all 0.2s',
            }}>
              {checkinLoading?'📍 Locating…':hasCheckedIn?`✓ You're on the globe`:'📍 Drop my pin'}
            </button>
            {hasCheckedIn && !isMobile && (
              <button onClick={()=>setShowShareCard(true)} style={{ background:'transparent',border:`1px solid ${accent}44`,borderRadius:100,padding:'11px 16px',fontSize:13,fontWeight:700,color:accent,cursor:'pointer',fontFamily:"'Syne',sans-serif" }}>Share 🎴</button>
            )}
          </div>
        </div>

        {/* Vibe meter */}
        <VibeMeter pulse={pulse} userVibe={userVibe} accent={accent} onVote={castVibe} />

        {/* Pulse bar + match schedule */}
        <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:6 }}>
          <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.22)',letterSpacing:'2px',fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>PULSE</span>
          <div style={{ flex:1,height:3,borderRadius:100,overflow:'hidden',background:'rgba(255,255,255,0.06)',display:'flex',gap:1 }}>
            {VIBES.map(v => {
              const total_ = Math.max(1,VIBES.reduce((s,vv)=>s+(pulse[vv.key]??0),0))
              const w = (pulse[v.key]??0)/total_*100
              return w > 0 ? <div key={v.key} style={{ width:`${w}%`,height:'100%',background:v.color,borderRadius:100,transition:'width 0.8s ease' }} /> : null
            })}
          </div>
          <MatchBrowser
            events={events} activeEventId={effectiveId} onSelect={handleSwitchEvent}
            snapshots={snapshots} mobileInline
            autoOpen={!!matchBrowserSport}
            initialSport={matchBrowserSport ?? undefined}
            onAutoOpenHandled={() => setMatchBrowserSport(null)}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',background:accent,color:'#000',fontSize:12,fontWeight:800,fontFamily:"'Syne',sans-serif",padding:'8px 20px',borderRadius:100,zIndex:50,whiteSpace:'nowrap',animation:'fadeUp 0.2s ease',pointerEvents:'none' }}>{toast}</div>}

      {showOnboarding && <OnboardingOverlay onDone={()=>setShowOnboarding(false)} />}
      {showPickSide && activeEvent && <PickYourSide event={activeEvent} onPick={side=>{ if(pendingPin) commitCheckin(pendingPin.lat,pendingPin.lng,side) }} />}
      {showShareCard && snapshot && <ShareCard event={activeEvent} snapshot={snapshot} userCity={undefined} userRank={undefined} onClose={()=>setShowShareCard(false)} />}
      {selectedCity && <CityPopup city={selectedCity} event={activeEvent} cheers={cheers} rank={cities.findIndex(c=>c.city===selectedCity.city)+1} accentColor={accent} onClose={()=>setSelectedCity(null)} />}
    </div>
  )
}

// Desktop: competition + match pills in one compact row
function DesktopEventStrip({ events, activeId, accent, onSelect }: { events:FanGlobeEvent[]; activeId:string; accent:string; onSelect:(id:string)=>void }) {
  const groups = new Map<string,{label:string;emoji:string;events:FanGlobeEvent[]}>()
  for (const e of events) {
    const slug = e.slug??e.id
    let key='other',label='Other',emoji='🏆'
    if(slug.startsWith('wc26-')||slug.startsWith('wc-')){key='wc';label='World Cup 2026';emoji='🏆'}
    else if(slug.startsWith('ucl26-')||slug.startsWith('ucl-')){key='ucl';label='Champions League';emoji='⭐'}
    else if(slug.startsWith('ipl26-')||slug.startsWith('ipl-')){key='ipl';label='IPL 2026';emoji='🏏'}
    else if(slug.startsWith('nba-')){key='nba';label='NBA 2026';emoji='🏀'}
    else if(slug.startsWith('f1-')){key='f1';label='Formula 1';emoji='🏎️'}
    if(!groups.has(key)) groups.set(key,{label,emoji,events:[]})
    groups.get(key)!.events.push(e)
  }
  const activeGroup = ([...groups.entries()].find(([,g])=>g.events.some(e=>(e.slug??e.id)===activeId))?.[0] ?? groups.keys().next().value) as string
  const [selGroup, setSelGroup] = useState<string|null>(null)
  const currentGroup = selGroup ?? activeGroup
  const groupEvents = groups.get(currentGroup)?.events ?? []
  const [page, setPage] = useState(0)
  const PAGE = 5

  return (
    <div style={{ display:'flex',alignItems:'center',gap:3,overflowX:'auto',scrollbarWidth:'none' }}>
      {[...groups.entries()].map(([k,g]) => {
        const act = k===currentGroup
        return (
          <button key={k} onClick={()=>{setSelGroup(k);setPage(0)}} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:100,border:'none',cursor:'pointer',flexShrink:0,transition:'all 0.15s',background:act?accent:'rgba(255,255,255,0.07)',color:act?'#000':'rgba(255,255,255,0.4)',fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700 }}>
            {g.emoji} {g.label} <span style={{ background:act?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.1)',padding:'0 4px',borderRadius:100,color:act?'#000':'rgba(255,255,255,0.3)',fontFamily:"'JetBrains Mono',monospace",fontSize:9 }}>{g.events.length}</span>
          </button>
        )
      })}
      <div style={{ width:1,height:14,background:'rgba(255,255,255,0.1)',flexShrink:0,margin:'0 3px' }} />
      {page>0 && <button onClick={()=>setPage(p=>p-1)} style={{ background:'rgba(255,255,255,0.07)',border:'none',borderRadius:'50%',width:18,height:18,cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>‹</button>}
      {groupEvents.slice(page*PAGE,(page+1)*PAGE).map(ev => {
        const id = ev.slug??ev.id; const act = id===activeId
        const mo = new Date(ev.kickoffAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})
        return (
          <button key={id} onClick={()=>onSelect(id)} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:100,border:'none',cursor:'pointer',flexShrink:0,transition:'all 0.15s',background:act?accent:'rgba(255,255,255,0.05)',color:act?'#000':'rgba(255,255,255,0.4)',fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:act?700:400 }}>
            <span style={{ fontSize:11 }}>{ev.homeFlag}</span>
            {ev.homeTeam.split(' ').slice(-1)[0]} v {ev.awayTeam.split(' ').slice(-1)[0]}
            <span style={{ fontSize:11 }}>{ev.awayFlag}</span>
            <span style={{ fontSize:9,opacity:0.35,fontFamily:"'JetBrains Mono',monospace" }}>{mo}</span>
          </button>
        )
      })}
      {(page+1)*PAGE < groupEvents.length && <button onClick={()=>setPage(p=>p+1)} style={{ background:'rgba(255,255,255,0.07)',border:'none',borderRadius:'50%',width:18,height:18,cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>›</button>}
    </div>
  )
}