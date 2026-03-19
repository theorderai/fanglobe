'use client'
import type { CityData } from '@/types'

interface Props { cities: CityData[]; total: number; countryCount: number; accentColor?: string }

const RANK_COLORS = ['#ffd166','rgba(200,200,200,0.55)','rgba(180,130,80,0.65)']

export default function Leaderboard({ cities, total, countryCount, accentColor = 'rgba(57,255,118,1)' }: Props) {
  const top = cities.slice(0, 9)
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)

  return (
    <div style={{ position:'fixed',right:24,top:'50%',transform:'translateY(-50%)',background:'rgba(6,7,10,0.82)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:18,padding:15,width:190,zIndex:20,backdropFilter:'blur(20px) saturate(1.5)',WebkitBackdropFilter:'blur(20px) saturate(1.5)',boxShadow:'0 0 0 1px rgba(255,255,255,0.02), 0 24px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace" }}>Top cities</span>
        <span style={{ fontSize:9,background:'rgba(255,255,255,0.06)',color:accentColor,borderRadius:100,padding:'2px 7px',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,border:`1px solid ${accentColor.replace('1)','0.2)')}` }}>{total.toLocaleString()}</span>
      </div>
      {top.map((c, i) => (
        <div key={c.city} style={{ display:'flex',alignItems:'center',gap:7,marginBottom:i<top.length-1?9:0,paddingBottom:i<top.length-1?9:0,borderBottom:i<top.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
          <span style={{ fontSize:10,color:RANK_COLORS[i]??'rgba(255,255,255,0.2)',width:12,textAlign:'right',fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{i+1}</span>
          <span style={{ fontSize:13,flexShrink:0 }}>{c.flag}</span>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.82)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600 }}>{c.city}</span>
          <span style={{ fontSize:10,fontWeight:700,color:accentColor,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.count)}</span>
        </div>
      ))}
      <div style={{ marginTop:12,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between' }}>
        <span style={{ fontSize:9,color:'rgba(255,255,255,0.25)',fontFamily:"'JetBrains Mono',monospace" }}>{countryCount} countries</span>
        <span style={{ fontSize:9,color:accentColor,fontFamily:"'JetBrains Mono',monospace",display:'flex',alignItems:'center',gap:4 }}><span style={{ width:4,height:4,borderRadius:'50%',background:accentColor,display:'inline-block' }} />live</span>
      </div>
    </div>
  )
}
