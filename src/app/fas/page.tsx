import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAS — FanGlobe Atmosphere Score Explained',
  description: 'The first proprietary metric measuring global fan energy in real time. A 0-100 score composed of fan density, emotion intensity, geographic spread, and cheer velocity.',
  openGraph: {
    title: 'FAS — The FanGlobe Atmosphere Score',
    description: 'The Elo rating for sports atmosphere. 0-100 scale. Real-time.',
    images: ['/api/og?type=fas'],
    type: 'website',
  },
}

export default function FASPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:10 }}>
        <Link href="/globe" style={{ fontSize:14, fontWeight:800, color:'#fff', textDecoration:'none' }}>
          fanglobe<span style={{ color:'#39FF76' }}>.live</span>
        </Link>
        <Link href="/fas/weekly" style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
          Weekly report →
        </Link>
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'60px 20px 80px' }}>
        {/* Hero */}
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

        {/* The scale */}
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

        {/* Formula */}
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
            <Component icon="📊" color="#39FF76" label="Fan Density · 40%" desc="Total fans watching relative to the expected peak for that sport. Logarithmic scale — 100K fans still register as meaningful, not just a rounding error." />
            <Component icon="🔥" color="#ff6b35" label="Emotion Intensity · 30%" desc="The proportion of strong emotional votes (Pumped, Ecstatic, Gutted) vs neutral. Nervous counts at half weight. Boosted by vote volume for reliability." />
            <Component icon="🌍" color="#00B4FF" label="Geographic Spread · 20%" desc="Countries and cities represented. A match tracked in 60+ countries scores higher than one concentrated in a single region." />
            <Component icon="💬" color="#ffd166" label="Cheer Velocity · 10%" desc="Cheers per minute. Proxy for real-time engagement intensity. A peak moment generates a flurry of fan messaging." />
            <Component icon="🔴" color="rgba(255,255,255,0.5)" label="Live Match Bonus · 5pts" desc="Matches currently in progress get a small boost. Atmosphere peaks during live action." />
          </div>
        </div>

        {/* Why it matters */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            Why it matters
          </div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.65)', lineHeight:1.8 }}>
            <p style={{ marginBottom:16 }}>
              Sports have no shared metric for <em style={{ color:'#fff' }}>atmosphere</em>. We have xG for shots, Elo for rankings, PER for players — but nothing for the thing fans actually tune in for: the feeling of the moment.
            </p>
            <p style={{ marginBottom:16 }}>
              FAS is built from the <strong style={{ color:'#fff' }}>first real-time geo-emotional dataset in sports</strong>. Every fan pin, every vibe vote, every cheer — aggregated across the globe, weighted by recency and geography, normalized against the sport's historical peak.
            </p>
            <p>
              It's early. The scores will calibrate over the next 12 months as we collect data across the World Cup, Champions League, IPL, and NBA playoffs. By 2027 we expect FAS scores to be quoted by broadcasters as naturally as "the crowd is loud tonight."
            </p>
          </div>
        </div>

        {/* Data sources */}
        <div style={{ marginBottom:56, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'22px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:14 }}>
            Data integrity
          </div>
          <ul style={{ listStyle:'none', padding:0, margin:0, fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.8 }}>
            <li style={{ marginBottom:10 }}>✓ All fan checkins verified by IP-based geolocation</li>
            <li style={{ marginBottom:10 }}>✓ hCaptcha invisible verification prevents bot floods</li>
            <li style={{ marginBottom:10 }}>✓ Rate limiting per session and per IP</li>
            <li style={{ marginBottom:10 }}>✓ Email-verified checkins weighted higher than anonymous</li>
            <li>✓ Methodology is open and unchanged across matches for comparability</li>
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(57,255,118,0.05)', border:'1px solid rgba(57,255,118,0.15)', borderRadius:16 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:10 }}>
            Watch FAS move in real time
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:22 }}>
            Every match on FanGlobe has a live FAS score. The higher it climbs, the more the world is locked in.
          </div>
          <Link href="/globe" style={{
            display:'inline-block', background:'#39FF76', color:'#000',
            fontWeight:800, fontSize:14, padding:'13px 32px', borderRadius:100,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
            boxShadow:'0 0 24px rgba(57,255,118,0.35)',
          }}>
            📍 Open the globe
          </Link>
        </div>
      </div>
    </div>
  )
}

function ScaleRow({ range, label, color, desc }: { range:string; label:string; color:string; desc:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ minWidth:70, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.3)' }}>{range}</div>
      <div style={{ minWidth:92, fontSize:14, fontWeight:800, color, fontFamily:"'Syne',sans-serif", letterSpacing:'1px', textTransform:'uppercase' }}>{label}</div>
      <div style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{desc}</div>
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
