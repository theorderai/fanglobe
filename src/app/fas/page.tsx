import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'FAS — FanGlobe Atmosphere Score Explained',
  description: 'The first proprietary metric measuring global fan energy in real time.',
  openGraph: {
    title: 'FAS — The FanGlobe Atmosphere Score',
    description: 'The Elo rating for sports atmosphere. 0-100 scale. Real-time.',
    images: ['/api/og?type=fas'],
  },
}

export default function FASPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex: 1, maxWidth:720, margin:'0 auto', padding:'50px 20px 40px', width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#39FF76', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:14 }}>
            The FanGlobe Atmosphere Score
          </div>
          <h1 style={{ fontSize:'clamp(32px,6vw,56px)', fontWeight:800, lineHeight:1.1, marginBottom:20, letterSpacing:-1.5 }}>
            How electric is this match,<br />really?
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.55)', lineHeight:1.7, maxWidth:520, margin:'0 auto' }}>
            FAS is a <strong style={{ color:'#fff' }}>0–100 composite metric</strong> measuring the global fan energy of any live sports event. Built from the first real-time geo-emotional dataset in sports.
          </p>
        </div>

        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            The scale
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <ScaleRow range="0–44"  label="Tepid"     color="rgba(255,255,255,0.35)" desc="Low engagement. Either pre-match or a dull match." />
            <ScaleRow range="45–69" label="Building"  color="#ffd166" desc="Real momentum. Fans across multiple countries are locked in." />
            <ScaleRow range="70–84" label="Electric"  color="#39FF76" desc="A top-tier sports moment. Wide geographic reach, strong emotion." />
            <ScaleRow range="85–100" label="Legendary" color="#ff6b35" desc="Generational. Think Brazil vs Morocco at minute 78. Talked about for years." />
          </div>
        </div>

        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            The formula
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 22px', marginBottom:18, fontFamily:"'JetBrains Mono',monospace" }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.9)', lineHeight:1.9 }}>
              FAS = 0.40 × <span style={{ color:'#39FF76' }}>Density</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.30 × <span style={{ color:'#ff6b35' }}>Emotion</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × <span style={{ color:'#00B4FF' }}>Spread</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 × <span style={{ color:'#ffd166' }}>Velocity</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ <span style={{ color:'rgba(255,255,255,0.4)' }}>Live Bonus (5pts)</span>
            </div>
          </div>
          <div style={{ display:'grid', gap:10 }}>
            <Component icon="📊" color="#39FF76" label="Fan Density · 40%" desc="Total fans watching relative to the expected peak for that sport. Logarithmic scale." />
            <Component icon="🔥" color="#ff6b35" label="Emotion Intensity · 30%" desc="Proportion of strong emotional votes (Pumped, Ecstatic, Gutted) vs neutral." />
            <Component icon="🌍" color="#00B4FF" label="Geographic Spread · 20%" desc="Countries and cities represented. Wide reach beats concentrated pockets." />
            <Component icon="💬" color="#ffd166" label="Cheer Velocity · 10%" desc="Cheers per minute. Proxy for real-time engagement intensity." />
            <Component icon="🔴" color="rgba(255,255,255,0.5)" label="Live Match Bonus · 5pts" desc="Matches currently in progress get a small boost." />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Link href="/fas/weekly" style={{
            flex:1, minWidth:200,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'rgba(57,255,118,0.08)', border:'1px solid rgba(57,255,118,0.25)',
            borderRadius:12, padding:'14px 16px',
            color:'#39FF76', fontSize:13, fontWeight:700,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
          }}>
            ⚡ This week's top matches →
          </Link>
          <Link href="/globe" style={{
            flex:1, minWidth:200,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'#39FF76', color:'#000',
            borderRadius:12, padding:'14px 16px',
            fontSize:13, fontWeight:800,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
            boxShadow:'0 0 20px rgba(57,255,118,0.3)',
          }}>
            📍 Watch FAS live
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

function ScaleRow({ range, label, color, desc }: { range:string; label:string; color:string; desc:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px', flexWrap:'wrap' }}>
      <div style={{ minWidth:70, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.3)' }}>{range}</div>
      <div style={{ minWidth:92, fontSize:14, fontWeight:800, color, fontFamily:"'Syne',sans-serif", letterSpacing:'1px', textTransform:'uppercase' }}>{label}</div>
      <div style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5, minWidth:180 }}>{desc}</div>
    </div>
  )
}

function Component({ icon, color, label, desc }: { icon:string; color:string; label:string; desc:string }) {
  return (
    <div style={{ display:'flex', gap:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:800, color, marginBottom:3, fontFamily:"'Syne',sans-serif" }}>{label}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{desc}</div>
      </div>
    </div>
  )
}
