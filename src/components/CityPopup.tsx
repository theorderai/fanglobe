'use client'
import type { CityData, FanGlobeEvent, Cheer } from '@/types'

interface Props {
  city: CityData; event: FanGlobeEvent; cheers: Cheer[]
  rank: number; onClose: () => void; accentColor: string
}

function fmtFans(n: number) {
  if (n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n>=1_000) return `${Math.round(n/1000)}K`
  return String(n)
}

export default function CityPopup({ city, event, cheers, rank, onClose, accentColor }: Props) {
  const cityCheers = cheers.filter(c => c.city === city.city).slice(0, 3)
  const homeColor = event.homeColor ?? '#39ff76'
  const awayColor = event.awayColor ?? '#00d4ff'
  const homePct = event.isRivalry && city.homeCount !== undefined
    ? Math.round((city.homeCount / Math.max(1, city.count)) * 100)
    : null

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{
        background:'#0d0d14', border:`2px solid ${accentColor.replace('1)','0.35)')}`,
        borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:340,
        boxShadow:`0 0 60px ${accentColor.replace('1)','0.15)')}, 0 24px 60px rgba(0,0,0,0.8)`,
        animation:'popIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        {/* Flag + city */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>{city.flag}</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{city.city}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontFamily:"'JetBrains Mono',monospace" }}>#{rank} globally</div>
        </div>

        {/* Fan count */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:48, fontWeight:800, color:accentColor, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, textShadow:`0 0 30px ${accentColor.replace('1)','0.4)')}` }}>
            {fmtFans(city.count)}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>fans watching</div>
        </div>

        {/* Rivalry split */}
        {homePct !== null && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:700, color:homeColor, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:18 }}>{event.homeFlag}</span> {homePct}%
              </span>
              <span style={{ fontSize:14, fontWeight:700, color:awayColor, display:'flex', alignItems:'center', gap:6 }}>
                {100-homePct}% <span style={{ fontSize:18 }}>{event.awayFlag}</span>
              </span>
            </div>
            <div style={{ height:8, borderRadius:100, overflow:'hidden', display:'flex', gap:2 }}>
              <div style={{ width:`${homePct}%`, background:homeColor, borderRadius:100, transition:'width 0.6s ease' }} />
              <div style={{ width:`${100-homePct}%`, background:awayColor, borderRadius:100, transition:'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* Local cheers */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>
            Local Cheers
          </div>
          {cityCheers.length > 0 ? cityCheers.map((c, i) => (
            <div key={c.id} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', marginBottom:i<cityCheers.length-1?6:0, fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.4, fontFamily:"'Syne',sans-serif" }}>
              {c.text}
            </div>
          )) : (
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.2)', fontStyle:'italic', textAlign:'center', padding:'8px 0' }}>
              No cheers from {city.city} yet
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}