import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'India vs Pakistan — Watch 1.6 Billion Fans Together | FanGlobe',
  description: 'June 10, 2026 at Nassau County NY. Track who\'s watching the biggest cricket match on Earth. Drop your pin on the global fan map.',
  openGraph: {
    title: 'India vs Pakistan — 1.6 Billion Fans, One Globe',
    description: 'Watch the most-viewed cricket match on Earth together. Drop your pin and represent your city.',
    images: ['/api/og?match=ind-pak-2026'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', images: ['/api/og?match=ind-pak-2026'] },
}

const MATCH_SLUG = 'ind-pak-2026'
const KICKOFF = new Date('2026-06-10T14:00:00Z')

const INDIA_CITIES = [
  { city: 'Mumbai',      flag: '🇮🇳', expected: 2_400_000 },
  { city: 'Delhi',       flag: '🇮🇳', expected: 1_800_000 },
  { city: 'Bengaluru',   flag: '🇮🇳', expected: 1_200_000 },
  { city: 'Kolkata',     flag: '🇮🇳', expected: 1_100_000 },
  { city: 'Chennai',     flag: '🇮🇳', expected: 980_000 },
  { city: 'Hyderabad',   flag: '🇮🇳', expected: 920_000 },
]
const PAK_CITIES = [
  { city: 'Karachi',     flag: '🇵🇰', expected: 1_100_000 },
  { city: 'Lahore',      flag: '🇵🇰', expected: 880_000 },
  { city: 'Islamabad',   flag: '🇵🇰', expected: 460_000 },
  { city: 'Faisalabad',  flag: '🇵🇰', expected: 320_000 },
]
const DIASPORA = [
  { city: 'New York',    flag: '🇺🇸', expected: 380_000 },
  { city: 'London',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', expected: 320_000 },
  { city: 'Toronto',     flag: '🇨🇦', expected: 240_000 },
  { city: 'Dubai',       flag: '🇦🇪', expected: 480_000 },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

export default function IndiaPakistanPage() {
  const daysUntil = Math.ceil((KICKOFF.getTime() - Date.now()) / 86400000)

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:10 }}>
        <Link href="/globe" style={{ fontSize:14, fontWeight:800, color:'#fff', textDecoration:'none' }}>
          fanglobe<span style={{ color:'#39FF76' }}>.live</span>
        </Link>
        <Link href={`/globe?match=${MATCH_SLUG}`} style={{ fontSize:11, fontWeight:700, color:'#000', background:'#39FF76', borderRadius:100, padding:'6px 16px', textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
          Drop your pin →
        </Link>
      </div>

      {/* Hero */}
      <div style={{ maxWidth:820, margin:'0 auto', padding:'60px 20px 40px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#00B4FF', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            {daysUntil > 0 ? `${daysUntil} days to kickoff` : '🔴 LIVE TODAY'} · June 10, 2026
          </div>
          <h1 style={{ fontSize:'clamp(36px,8vw,68px)', fontWeight:800, lineHeight:1.1, marginBottom:20, letterSpacing:-1.5 }}>
            India vs Pakistan<br />
            <span style={{ background:'linear-gradient(135deg, #FF9933 0%, #01411C 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              1.6 billion fans, one globe
            </span>
          </h1>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.55)', lineHeight:1.6, maxWidth:540, margin:'0 auto' }}>
            The most-watched cricket match on Earth. Nassau County International Stadium, New York. Drop your pin and watch with 1.6 billion others.
          </p>
        </div>

        {/* Massive stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:40 }}>
          {[
            { label:'Expected global viewers', value:'2.4M+', color:'#FF9933' },
            { label:'Cities tracking', value:'60+', color:'#fff' },
            { label:'Diaspora countries', value:'40+', color:'#01411C' },
          ].map((s, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 14px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Country split */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            🌍 Global fan split (expected)
          </div>
          <div style={{ height:14, borderRadius:100, overflow:'hidden', display:'flex', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:'62%', background:'linear-gradient(90deg,#FF9933 0%,#FF9933 100%)', display:'flex', alignItems:'center', paddingLeft:12, color:'#000', fontWeight:800, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
              🇮🇳 62%
            </div>
            <div style={{ width:'28%', background:'linear-gradient(90deg,#01411C 0%,#01411C 100%)', display:'flex', alignItems:'center', paddingLeft:12, color:'#fff', fontWeight:800, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
              🇵🇰 28%
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', paddingLeft:10, color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
              🌍 10% diaspora
            </div>
          </div>
        </div>

        {/* Top expected cities by country */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:40 }}>
          <CitySection title="🇮🇳 India" color="#FF9933" cities={INDIA_CITIES} />
          <CitySection title="🇵🇰 Pakistan" color="#01411C" cities={PAK_CITIES} />
          <CitySection title="🌍 Global diaspora" color="#fff" cities={DIASPORA} />
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', background:'linear-gradient(135deg, rgba(255,153,51,0.08) 0%, rgba(1,65,28,0.08) 100%)', border:'1px solid rgba(0,180,255,0.2)', borderRadius:18, padding:'32px 20px' }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:10, lineHeight:1.3 }}>
            Which city watches hardest?
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:24, lineHeight:1.6, maxWidth:420, margin:'0 auto 24px' }}>
            Mumbai vs Karachi. London vs New York. Let your city rally. Every pin counts for the leaderboard.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href={`/globe?match=${MATCH_SLUG}`} style={{
              display:'inline-block', background:'#00B4FF', color:'#000',
              fontWeight:800, fontSize:14, padding:'13px 32px', borderRadius:100,
              textDecoration:'none', fontFamily:"'Syne',sans-serif",
              boxShadow:'0 0 24px rgba(0,180,255,0.4)',
            }}>
              📍 Drop my pin
            </Link>
            <Link href={`/leaderboard?match=${MATCH_SLUG}`} style={{
              display:'inline-block', background:'rgba(255,255,255,0.06)', color:'#fff',
              fontWeight:700, fontSize:14, padding:'13px 26px', borderRadius:100,
              textDecoration:'none', fontFamily:"'Syne',sans-serif",
              border:'1px solid rgba(255,255,255,0.15)',
            }}>
              🏆 See leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function CitySection({ title, color, cities }: { title: string; color: string; cities: typeof INDIA_CITIES }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:11, fontWeight:700, color, marginBottom:10, fontFamily:"'JetBrains Mono',monospace" }}>
        {title}
      </div>
      {cities.map((c, i) => (
        <div key={c.city} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom: i < cities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", minWidth:14 }}>{i+1}</span>
          <span style={{ fontSize:14 }}>{c.flag}</span>
          <span style={{ fontSize:12, color:'#fff', flex:1, fontWeight:500 }}>{c.city}</span>
          <span style={{ fontSize:11, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.expected)}</span>
        </div>
      ))}
    </div>
  )
}
