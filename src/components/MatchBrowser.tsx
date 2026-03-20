'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import type { FanGlobeEvent } from '@/types'

interface MatchSnapshot { totalCount: number; pulse: { fire:number;ecstatic:number;nervous:number;crushed:number;moment:number } }
interface Props {
  events: FanGlobeEvent[]
  activeEventId: string
  onSelect: (id: string) => void
  snapshots: Record<string, MatchSnapshot>
  mobileInline?: boolean
}

function getEventDates(events: FanGlobeEvent[]): Date[] {
  const seen = new Set<string>()
  const dates: Date[] = []
  for (const e of events) {
    const d = new Date(e.kickoffAt)
    const key = d.toDateString()
    if (!seen.has(key)) { seen.add(key); dates.push(d) }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}

function formatDayLabel(d: Date) {
  const now = new Date()
  if (isSameDay(d, now)) return { top: 'TODAY', bot: '' }
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (diff <= 7) return { top: d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase(), bot: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) }
  return { top: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), bot: '' }
}

function fmtFans(n: number) {
  if (n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n>=1_000) return `${Math.round(n/1000)}K`
  return String(n)
}

function MatchCard({ event, active, snap, onSelect }: { event: FanGlobeEvent; active: boolean; snap?: MatchSnapshot; onSelect: () => void }) {
  const countdown = useCountdown(event.kickoffAt)
  const isLive = countdown === 'LIVE'
  const fans = snap?.totalCount ?? 0
  const { SPORTS } = require('@/types')
  const sport = event.sport ?? SPORTS[event.sportId]
  const accent = sport?.arcColor ? sport.arcColor+'1)' : 'rgba(57,255,118,1)'

  const kickoffStr = new Date(event.kickoffAt).toLocaleDateString('en-US',{ month:'short', day:'numeric' }) + ' · ' +
    new Date(event.kickoffAt).toLocaleTimeString('en-US',{ hour:'numeric', minute:'2-digit', timeZoneName:'short' })

  return (
    <button onClick={onSelect} style={{
      width:'100%', background: active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      border:`1px solid ${active ? accent.replace('1)','0.3)') : 'rgba(255,255,255,0.07)'}`,
      borderRadius:14, padding:'14px 16px', cursor:'pointer',
      display:'flex', alignItems:'center', gap:12, textAlign:'left',
      transition:'all 0.15s',
    }}>
      {/* Left: live dot */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0, width:8 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background: isLive ? '#dc2626' : 'rgba(255,255,255,0.2)', boxShadow: isLive ? '0 0 6px #dc2626' : 'none' }} />
      </div>

      {/* Center: teams stacked */}
      <div style={{ flex:1, minWidth:0 }}>
        {isLive ? (
          <div style={{ fontSize:10, color:'#dc2626', fontWeight:700, marginBottom:6, display:'flex', alignItems:'center', gap:4, fontFamily:"'JetBrains Mono',monospace" }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:'#dc2626',display:'inline-block' }} />
            LIVE · {event.venueShort}
          </div>
        ) : (
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>
            {kickoffStr} · {event.venueShort}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>{event.homeFlag}</span>
          <span style={{ fontSize:14, fontWeight:700, color: event.homeColor ?? '#fff', fontFamily:"'Syne',sans-serif" }}>{event.homeTeam}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{event.awayFlag}</span>
          <span style={{ fontSize:14, fontWeight:600, color: event.awayColor ? event.awayColor+'cc' : 'rgba(255,255,255,0.6)', fontFamily:"'Syne',sans-serif" }}>{event.awayTeam}</span>
        </div>
      </div>

      {/* Right: fans + badges */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {fans > 0 && (
          <>
            <div style={{ fontSize:22, fontWeight:800, color: isLive ? accent : '#fff', fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{fmtFans(fans)}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2, letterSpacing:'0.5px' }}>fans watching</div>
          </>
        )}
        {!fans && !isLive && (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontFamily:"'JetBrains Mono',monospace" }}>{countdown}</div>
        )}
        {event.isRivalry && (
          <div style={{ marginTop:6, background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:6, padding:'3px 8px', display:'inline-flex', alignItems:'center', gap:4, fontSize:10, color:'#EA580C', fontWeight:700 }}>
            ⚔️ RIVALRY
          </div>
        )}
      </div>
    </button>
  )
}

export default function MatchBrowser({ events, activeEventId, onSelect, snapshots, mobileInline }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSport, setActiveSport] = useState('soccer')
  const [selectedDate, setSelectedDate] = useState<Date|null>(null)

  const activeEvent = events.find(e => (e.slug??e.id) === activeEventId) ?? events.find(e => e.id === activeEventId) ?? events[0]
  if (!activeEvent) return null

  const sportEvents = useMemo(() => events.filter(e => e.sportId === activeSport), [events, activeSport])
  const dates = useMemo(() => getEventDates(sportEvents), [sportEvents])

  useEffect(() => { if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]) }, [dates])

  const dayEvents = useMemo(() => {
    if (!selectedDate) return sportEvents
    return sportEvents.filter(e => isSameDay(new Date(e.kickoffAt), selectedDate))
  }, [sportEvents, selectedDate])

  const liveCount = events.filter(e => { const diff = new Date(e.kickoffAt).getTime() - Date.now(); return diff < 0 && diff > -7200000 }).length
  const totalLiveFans = Object.values(snapshots).reduce((s, d) => s + (d.totalCount ?? 0), 0)

  const availableSports = ['soccer','cricket','f1','nba'].filter(s => events.some(e => e.sportId === s))
  const sportConfig: Record<string,{name:string;emoji:string}> = {
    soccer:{name:'Football',emoji:'⚽'}, cricket:{name:'Cricket',emoji:'🏏'}, f1:{name:'Formula 1',emoji:'🏎️'}, nba:{name:'NBA',emoji:'🏀'}
  }

  const handleSelect = useCallback((id: string) => { onSelect(id); setIsOpen(false) }, [onSelect])

  // Inline icon for mobile pulse bar
  if (mobileInline) {
    return (
      <>
        <button onClick={() => setIsOpen(true)} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, flexShrink:0, padding:'2px 4px' }}>
          <span style={{ fontSize:14 }}>📅</span>
          {liveCount > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'#dc2626', fontWeight:700, background:'rgba(220,38,38,0.12)', padding:'2px 6px', borderRadius:100 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#dc2626',display:'inline-block' }} />{liveCount}
            </span>
          )}
        </button>
        {isOpen && <MatchBrowserSheet events={events} activeEventId={activeEventId} onSelect={handleSelect} snapshots={snapshots} onClose={() => setIsOpen(false)} availableSports={availableSports} sportConfig={sportConfig} activeSport={activeSport} setActiveSport={(s) => { setActiveSport(s); setSelectedDate(null) }} dates={dates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dayEvents={dayEvents} liveCount={liveCount} totalLiveFans={totalLiveFans} />}
      </>
    )
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} style={{ position:'fixed', bottom:260, left:'50%', transform:'translateX(-50%)', zIndex:25, background:'rgba(4,5,8,0.92)', border:'1px solid rgba(255,255,255,0.16)', borderRadius:100, padding:'8px 18px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', backdropFilter:'blur(20px)', fontFamily:"'Syne',sans-serif", boxShadow:'0 2px 20px rgba(0,0,0,0.6)', whiteSpace:'nowrap' }}>
        <span style={{ fontSize:13 }}>📅</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>Match Schedule</span>
        {liveCount > 0 && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'#dc2626', fontWeight:700, background:'rgba(220,38,38,0.12)', padding:'2px 7px', borderRadius:100 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#dc2626',display:'inline-block' }} />{liveCount} live</span>}
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>↑</span>
      </button>
      {isOpen && <MatchBrowserSheet events={events} activeEventId={activeEventId} onSelect={handleSelect} snapshots={snapshots} onClose={() => setIsOpen(false)} availableSports={availableSports} sportConfig={sportConfig} activeSport={activeSport} setActiveSport={(s) => { setActiveSport(s); setSelectedDate(null) }} dates={dates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dayEvents={dayEvents} liveCount={liveCount} totalLiveFans={totalLiveFans} />}
    </>
  )
}

function MatchBrowserSheet({ events, activeEventId, onSelect, snapshots, onClose, availableSports, sportConfig, activeSport, setActiveSport, dates, selectedDate, setSelectedDate, dayEvents, liveCount, totalLiveFans }: {
  events: FanGlobeEvent[]; activeEventId: string; onSelect: (id:string)=>void; snapshots: Record<string,MatchSnapshot>; onClose:()=>void; availableSports:string[]; sportConfig:Record<string,{name:string;emoji:string}>; activeSport:string; setActiveSport:(s:string)=>void; dates:Date[]; selectedDate:Date|null; setSelectedDate:(d:Date)=>void; dayEvents:FanGlobeEvent[]; liveCount:number; totalLiveFans:number
}) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#0d0d14', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px 20px 0 0', maxHeight:'85vh', display:'flex', flexDirection:'column', animation:'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:40, height:4, borderRadius:100, background:'rgba(255,255,255,0.15)' }} />
        </div>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'8px 20px 12px' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:"'Syne',sans-serif" }}>Match Schedule</div>
            {liveCount > 0 && (
              <div style={{ fontSize:12, color:'#dc2626', fontWeight:700, marginTop:4, display:'flex', alignItems:'center', gap:6, fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'#dc2626',display:'inline-block',boxShadow:'0 0 6px #dc2626' }} />
                {liveCount} match{liveCount>1?'es':''} live now · {totalLiveFans > 0 ? `${(totalLiveFans/1000000).toFixed(1)}M` : '—'} fans watching
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>
        {/* Sport tabs */}
        <div style={{ display:'flex', gap:6, padding:'0 20px 12px', overflowX:'auto', scrollbarWidth:'none' }}>
          {availableSports.map(s => {
            const isActive = s===activeSport
            return (
              <button key={s} onClick={() => setActiveSport(s)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:100, border:'none', cursor:'pointer', flexShrink:0, background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color: isActive ? '#fff' : 'rgba(255,255,255,0.45)', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, transition:'all 0.15s' }}>
                <span style={{ fontSize:16 }}>{sportConfig[s]?.emoji}</span>
                {sportConfig[s]?.name}
              </button>
            )
          })}
        </div>
        {/* Date strip */}
        <div style={{ display:'flex', gap:6, padding:'0 20px 12px', overflowX:'auto', scrollbarWidth:'none' }}>
          {dates.slice(0,14).map(d => {
            const isActive = selectedDate && isSameDay(d, selectedDate)
            const lbl = formatDayLabel(d)
            const hasLive = events.some(e => e.sportId===activeSport && isSameDay(new Date(e.kickoffAt), d) && Date.now() > new Date(e.kickoffAt).getTime())
            return (
              <button key={d.toDateString()} onClick={() => setSelectedDate(d)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1, padding:'8px 12px', borderRadius:12, border:'none', cursor:'pointer', flexShrink:0, minWidth:56, background: isActive ? '#fff' : 'rgba(255,255,255,0.05)', position:'relative', transition:'all 0.15s' }}>
                {hasLive && <span style={{ position:'absolute', top:5, right:5, width:5, height:5, borderRadius:'50%', background:'#dc2626' }} />}
                <span style={{ fontSize:9, fontWeight:700, color: isActive ? '#000' : 'rgba(255,255,255,0.4)', letterSpacing:'0.5px' }}>{lbl.top}</span>
                {lbl.bot && <span style={{ fontSize:11, fontWeight:700, color: isActive ? '#000' : 'rgba(255,255,255,0.7)' }}>{lbl.bot}</span>}
              </button>
            )
          })}
        </div>
        {/* Match list */}
        <div style={{ overflowY:'auto', padding:'0 14px 24px', display:'flex', flexDirection:'column', gap:8 }}>
          {dayEvents.length === 0 ? (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', padding:'32px 0', fontSize:13, fontFamily:"'Syne',sans-serif" }}>No matches on this day</div>
          ) : (
            dayEvents.map(ev => (
              <MatchCard key={ev.id} event={ev} active={(ev.slug??ev.id)===activeEventId || ev.id===activeEventId} snap={snapshots[ev.slug??ev.id] ?? snapshots[ev.id]} onSelect={() => onSelect(ev.slug??ev.id)} />
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>
    </div>
  )
}