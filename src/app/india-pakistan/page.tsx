import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'India vs Pakistan — Watch 1.6 Billion Fans Together | FanGlobe',
  description: 'June 10, 2026 at Nassau County NY. Track who\'s watching the biggest cricket match on Earth.',
  openGraph: {
    title: 'India vs Pakistan — 1.6 Billion Fans, One Globe',
    description: 'Watch the most-viewed cricket match on Earth together.',
    images: ['/api/og?match=ind-pak-2026'],
  },
}

const MATCH_SLUG = 'ind-pak-2026'
const KICKOFF = new Date('2026-06-10T14:00:00Z')

const INDIA_CITIES = [
  { city: 'Mumbai', flag: '🇮🇳', expected: 2_400_000 },
  { city: 'Delhi', flag: '🇮🇳', expected: 1_800_000 },
  { city: 'Bengaluru', flag: '🇮🇳', expected: 1_200_000 },
  { city: 'Kolkata', flag: '🇮🇳', expected: 1_100_000 },
  { city: 'Chennai', flag: '🇮🇳', expected: 980_000 },
  { city: 'Hyderabad', flag: '🇮🇳', expected: 920_000 },
]
const PAK_CITIES = [
  { city: 'Karachi', flag: '🇵🇰', expected: 1_100_000 },
  { city: 'Lahore', flag: '🇵🇰', expected: 880_000 },
  { city: 'Islamabad', flag: '🇵🇰', expected: 460_000 },
  { city: 'Faisalabad', flag: '🇵🇰', expected: 320_000 },
]
const DIASPORA = [
  { city: 'New York', flag: '🇺🇸', expected: 380_000 },
  { city: 'London', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', expected: 320_000 },
  { city: 'Toronto', flag: '🇨🇦', expected: 240_000 },
  { city: 'Dubai', flag: '🇦🇪', expected: 480_000 },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

export default function IndiaPakistanPage() {
  const daysUntil = Math.ceil((KICKOFF.getTime() - Date.now()) / 86400000)

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex:1, maxWidth:820, margin:'0 auto', padding:'50px 20px 40px', width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#00B4FF', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            {daysUntil > 0 ? `${daysUntil} days to kickoff` : '🔴 LIVE TODAY'} · June 10, 2026
          </div>
          <h1 style={{ fontSize:'clamp(32px,7vw,60px)', fontWeight:800, lineHeight:1.1, marginBottom:20, letterSpacing:-1.5 }}>
            India vs Pakistan<br />
            <span style={{ background:'linear-gradient(135deg, #FF9933 0%, #01411C 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              1.6 billion fans, one globe
            </span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.55)', lineHeight:1.6, maxWidth:540, margin:'0 auto' }}>
            The most-watched cricket match on Earth. Nassau County International Stadium, New York. Drop your pin and watch with 1.6 billion others.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:32 }}>
          {[
            { label:'Expected viewers', value:'2.4M+', color:'#FF9933' },
            { label:'Cities tracking', value:'60+', color:'#fff' },
            { label:'Diaspora countries', value:'40+', color:'#01411C' },
          ].map((s, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 12px', textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            🌍 Expected global fan split
          </div>
          <div style={{ height:14, borderRadius:100, overflow:'hidden', display:'flex', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:'62%', background:'#FF9933', display:'flex', alignItems:'center', paddingLeft:12, color:'#000', fontWeight:800, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
              🇮🇳 62%
            </div>
            <div style={{ width:'28%', background:'#01411C', display:'flex', alignItems:'center', paddingLeft:10, color:'#fff', fontWeight:800, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
              🇵🇰 28%
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', paddingLeft:8, color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>
              🌍 10%
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:32 }}>
          <CitySection title="🇮🇳 India" color="#FF9933" cities={INDIA_CITIES} />
          <CitySection title="🇵🇰 Pakistan" color="#01411C" cities={PAK_CITIES} />
          <CitySection title="🌍 Diaspora" color="#fff" cities={DIASPORA} />
        </div>

        <div style={{ textAlign:'center', background:'linear-gradient(135deg, rgba(255,153,51,0.08) 0%, rgba(1,65,28,0.08) 100%)', border:'1px solid rgba(0,180,255,0.2)', borderRadius:18, padding:'28px 20px' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:10, lineHeight:1.3 }}>
            Which city watches hardest?
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20, lineHeight:1.6, maxWidth:420, margin:'0 auto 20px' }}>
            Mumbai vs Karachi. London vs New York. Let your city rally. Every pin counts.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href={`/globe?match=${MATCH_SLUG}`} style={{
              display:'inline-block', background:'#00B4FF', color:'#000',
              fontWeight:800, fontSize:14, padding:'12px 28px', borderRadius:100,
              textDecoration:'none', fontFamily:"'Syne',sans-serif",
              boxShadow:'0 0 24px rgba(0,180,255,0.4)',
            }}>
              📍 Drop my pin
            </Link>
            <Link href={`/leaderboard?match=${MATCH_SLUG}`} style={{
              display:'inline-block', background:'rgba(255,255,255,0.06)', color:'#fff',
              fontWeight:700, fontSize:14, padding:'12px 24px', borderRadius:100,
              textDecoration:'none', fontFamily:"'Syne',sans-serif",
              border:'1px solid rgba(255,255,255,0.15)',
            }}>
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
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
