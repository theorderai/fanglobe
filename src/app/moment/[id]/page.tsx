import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createServiceClient } from '@/lib/supabase-server'

interface Props { params: Promise<{ id: string }> }

async function getMoment(shortId: string) {
  try {
    const supabase = createServiceClient()
    const { data: moment } = await supabase
      .from('clutch_moments').select('*').eq('short_id', shortId).single()
    if (!moment) return null
    const { data: event } = await supabase
      .from('events')
      .select('home_team, away_team, home_flag, away_flag, slug, kickoff_at, venue')
      .eq('slug', moment.match_id).single()
    return { moment, event }
  } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getMoment(id)
  if (!data?.event) return { title: 'FanGlobe Moment' }
  const { moment, event } = data
  const title = `${moment.title} — ${event.home_team} vs ${event.away_team}`
  const description = `${moment.fans_at_moment.toLocaleString()} fans watching ${event.home_team} vs ${event.away_team}. ${moment.top_city} was the loudest city.`
  return {
    title: `${title} | FanGlobe`,
    description,
    openGraph: {
      title, description,
      images: [`/api/og?clutch=${id}`],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/api/og?clutch=${id}`] },
  }
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

function fasColor(score: number) {
  if (score >= 85) return '#ff6b35'
  if (score >= 70) return '#39FF76'
  if (score >= 45) return '#ffd166'
  return 'rgba(255,255,255,0.4)'
}

const VIBES = [
  { key:'fire',     label:'Pumped',   color:'#ff6b35' },
  { key:'ecstatic', label:'Ecstatic', color:'#ffd166' },
  { key:'nervous',  label:'Nervous',  color:'#a78bfa' },
  { key:'crushed',  label:'Gutted',   color:'#60a5fa' },
]

export default async function ClutchMomentPage({ params }: Props) {
  const { id } = await params
  const data = await getMoment(id)

  if (!data?.event) {
    return (
      <div style={{ minHeight:'100vh', background:'#04050a', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontFamily:"'Syne',sans-serif" }}>
        Moment not found. <Link href="/globe" style={{ color:'#39FF76', marginLeft:8 }}>Go to globe →</Link>
      </div>
    )
  }

  const { moment, event } = data
  const cities = Array.isArray(moment.cities_data) ? moment.cities_data.slice(0, 6) : []
  const vibes = typeof moment.vibe_snapshot === 'object' ? moment.vibe_snapshot as Record<string, number> : {}
  const totalVibe = Object.values(vibes).reduce((s, n) => s + Number(n), 0)
  const cheers = Array.isArray(moment.cheers_sample) ? moment.cheers_sample : []

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex:1, maxWidth:720, margin:'0 auto', padding:'40px 20px', width:'100%' }}>

        {/* Hero — the moment card */}
        <div style={{
          background: `linear-gradient(135deg, ${fasColor(moment.fas_score)}18 0%, transparent 70%)`,
          border: `1px solid ${fasColor(moment.fas_score)}44`,
          borderRadius: 20, padding: '32px 24px', marginBottom: 24, textAlign:'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, fontWeight: 800, color:'#fff' }}>
            {moment.title}
          </div>
          {moment.minute && (
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', fontFamily:"'JetBrains Mono',monospace", marginBottom:14 }}>
              {moment.minute}&apos; · {new Date(moment.created_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
            </div>
          )}

          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>
            {event.home_flag} {event.home_team} <span style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>vs</span> {event.away_team} {event.away_flag}
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:14, padding:'8px 16px', background:'rgba(0,0,0,0.3)', borderRadius:100, border:`1px solid ${fasColor(moment.fas_score)}33` }}>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px' }}>FAS</span>
            <span style={{ fontSize:24, fontWeight:800, color:fasColor(moment.fas_score), fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>
              {moment.fas_score}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
          <Stat value={fmt(moment.fans_at_moment)} label="Fans watching" />
          <Stat value={moment.top_city ?? '—'} label="Loudest city" color="#39FF76" />
          <Stat value={`${moment.view_count ?? 0}`} label="Views" />
        </div>

        {/* Top cities */}
        {cities.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <SectionHeader label="🏆 At this moment" />
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden' }}>
              {cities.map((c: {city:string;flag?:string;count:number}, i: number) => (
                <div key={c.city} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i < cities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:"'JetBrains Mono',monospace", minWidth:16 }}>{i+1}</span>
                  <span style={{ fontSize:14 }}>{c.flag ?? '📍'}</span>
                  <span style={{ flex:1, fontSize:13, color:'#fff', fontWeight:600 }}>{c.city}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'#39FF76', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vibes */}
        {totalVibe > 0 && (
          <div style={{ marginBottom:24 }}>
            <SectionHeader label="💫 The crowd felt" />
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'16px' }}>
              <div style={{ display:'flex', height:8, borderRadius:100, overflow:'hidden', gap:2, marginBottom:12 }}>
                {VIBES.map(v => {
                  const pct = totalVibe > 0 ? (Number(vibes[v.key] ?? 0) / totalVibe) * 100 : 0
                  if (pct <= 0) return null
                  return <div key={v.key} style={{ width:`${pct}%`, background:v.color, borderRadius:100 }} />
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                {VIBES.map(v => {
                  const pct = totalVibe > 0 ? Math.round((Number(vibes[v.key] ?? 0) / totalVibe) * 100) : 0
                  return (
                    <div key={v.key} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:v.color }} />
                      <span style={{ fontSize:11, fontWeight:700, color:v.color, fontFamily:"'JetBrains Mono',monospace" }}>{pct}%</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{v.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cheers sample */}
        {cheers.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="💬 Voices" />
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {cheers.map((c: {city?:string;flag?:string;text?:string;vibe?:string}, i: number) => {
                const vibe = VIBES.find(v => v.key === c.vibe)
                return (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${vibe?.color ?? 'rgba(255,255,255,0.08)'}22`, borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:6, fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>
                      <span>{c.flag}</span><span>{c.city}</span>
                    </div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.5 }}>{c.text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <Link href={`/match/${event.slug}/report`} style={ctaSecondary}>
            📊 Full report
          </Link>
          <Link href="/globe" style={ctaPrimary}>
            📍 Join next match
          </Link>
        </div>
        <div style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", marginTop:14 }}>
          fanglobe.live/moment/{moment.short_id}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

function Stat({ value, label, color = '#fff' }: { value:string; label:string; color?:string }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
      <div style={{ fontSize:20, fontWeight:800, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>{label}</div>
    </div>
  )
}

function SectionHeader({ label }: { label:string }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>
      {label}
    </div>
  )
}

const ctaSecondary: React.CSSProperties = {
  display:'flex', alignItems:'center', justifyContent:'center',
  padding:'12px 16px', borderRadius:12,
  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
  color:'#fff', fontSize:13, fontWeight:700,
  textDecoration:'none', fontFamily:"'Syne',sans-serif",
}

const ctaPrimary: React.CSSProperties = {
  display:'flex', alignItems:'center', justifyContent:'center',
  padding:'12px 16px', borderRadius:12,
  background:'#39FF76', color:'#000',
  fontSize:13, fontWeight:800,
  textDecoration:'none', fontFamily:"'Syne',sans-serif",
  boxShadow:'0 0 20px rgba(57,255,118,0.3)',
}
