import { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase-server'
import { getEventSeedCities, getExpectedReach } from '@/lib/events'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

async function getEvent(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: 'FanGlobe — Live Fan Tracker' }

  const reach = getExpectedReach(slug)
  const title = `${event.home_team} vs ${event.away_team} — FanGlobe Live Fan Tracker`
  const description = `${Math.round(reach/1000)}K+ fans expected to track ${event.home_team} vs ${event.away_team} on FanGlobe. Drop your pin and join the global fan map.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og?match=${slug}`],
      url: `https://fanglobe.live/match/${slug}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/api/og?match=${slug}`] },
  }
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return null
  return Math.ceil(diff / 86400000)
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    return (
      <div style={{ minHeight:'100vh', background:'#04050a', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontFamily:"'Syne',sans-serif" }}>
        Match not found. <Link href="/globe" style={{ color:'#39FF76', marginLeft:8 }}>Go to globe →</Link>
      </div>
    )
  }

  const reach = getExpectedReach(slug)
  const cities = getEventSeedCities(slug)
  const days = daysUntil(event.kickoff_at)
  const kickoffDate = new Date(event.kickoff_at).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const kickoffTime = new Date(event.kickoff_at).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', timeZoneName:'short' })

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(20px)' }}>
        <Link href="/globe" style={{ fontSize:14, fontWeight:800, color:'#fff', textDecoration:'none' }}>
          fanglobe<span style={{ color:'#39FF76' }}>.live</span>
        </Link>
        <Link href={`/globe?match=${slug}`} style={{ fontSize:11, fontWeight:700, color:'#000', background:'#39FF76', borderRadius:100, padding:'6px 16px', textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
          Watch on globe →
        </Link>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'40px 20px' }}>

        {/* Match hero */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          {days !== null && (
            <div style={{ fontSize:11, fontWeight:700, color:'#39FF76', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
              {days === 0 ? '🔴 LIVE TODAY' : `${days} days to kickoff`}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52 }}>{event.home_flag}</div>
              <div style={{ fontSize:22, fontWeight:800, color: event.home_color ?? '#fff', marginTop:6 }}>{event.home_team}</div>
            </div>
            <div style={{ fontSize:18, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>vs</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52 }}>{event.away_flag}</div>
              <div style={{ fontSize:22, fontWeight:800, color: event.away_color ?? '#fff', marginTop:6 }}>{event.away_team}</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{event.venue}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:"'JetBrains Mono',monospace" }}>{kickoffDate} · {kickoffTime}</div>
        </div>

        {/* Expected reach stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:32 }}>
          {[
            { label:'Expected fans', value: fmt(reach) },
            { label:'Countries tracking', value: `${new Set(cities.map(c=>c.country)).size}+` },
            { label:'Cities on globe', value: `${cities.length}+` },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:800, color:'#39FF76', fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Globe embed preview */}
        <div style={{ marginBottom:32, borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:"'JetBrains Mono',monospace" }}>Live fan globe</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'JetBrains Mono',monospace" }}>Auto-updates</span>
          </div>
          <iframe src={`/widget/${slug}`} width="100%" height="280" style={{ border:'none', display:'block' }} title="FanGlobe live widget" />
        </div>

        {/* Top expected cities */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>Expected fan hotspots</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {cities.slice(0,6).map((c, i) => (
              <div key={c.city} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 12px' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'JetBrains Mono',monospace", minWidth:16 }}>{i+1}</span>
                <span style={{ fontSize:18 }}>{c.flag}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.city}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{c.country}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'#39FF76', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', background:'rgba(57,255,118,0.05)', border:'1px solid rgba(57,255,118,0.15)', borderRadius:16, padding:'28px 20px' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:8 }}>
            Drop your pin. Be part of the {event.home_team} vs {event.away_team} story.
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20, lineHeight:1.6 }}>
            Join fans from {new Set(cities.map(c=>c.country)).size}+ countries watching together on the globe.
          </div>
          <Link href={`/globe?match=${slug}`} style={{
            display:'inline-block', background:'#39FF76', color:'#000',
            fontWeight:800, fontSize:14, padding:'13px 36px', borderRadius:100,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
            boxShadow:'0 0 24px rgba(57,255,118,0.35)',
          }}>
            📍 Drop my pin
          </Link>
        </div>
      </div>
    </div>
  )
}