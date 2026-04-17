import { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase-server'

export const revalidate = 600

interface Props { params: Promise<{ slug: string }> }

async function getMatchReport(slug: string) {
  try {
    const supabase = createServiceClient()

    const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single()
    if (!event) return null

    // Get all snapshots for this match (timeline)
    const { data: snaps } = await supabase
      .from('snapshots')
      .select('fas_score, fas_label, total, pulse_fire, pulse_ecstatic, pulse_nervous, pulse_crushed, city_counts, snapped_at')
      .eq('match_id', slug)
      .order('snapped_at', { ascending: true })

    if (!snaps?.length) return { event, snapshots: [] }

    // Get best cheers from this match
    const { data: cheers } = await supabase
      .from('cheers')
      .select('city, flag, text, vibe, created_at')
      .eq('match_id', slug)
      .eq('moderated', true)
      .order('created_at', { ascending: false })
      .limit(8)

    return { event, snapshots: snaps, cheers: cheers ?? [] }
  } catch (err) {
    console.error('report error:', err)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const report = await getMatchReport(slug)
  if (!report?.event) return { title: 'Match Report — FanGlobe' }
  const { event } = report
  const peakFAS = report.snapshots?.reduce((m, s) => Math.max(m, s.fas_score ?? 0), 0) ?? 0
  return {
    title: `${event.home_team} vs ${event.away_team} — Match Report | FanGlobe`,
    description: `FAS peaked at ${peakFAS}. Full fan report from ${event.home_team} vs ${event.away_team}.`,
    openGraph: {
      title: `${event.home_team} vs ${event.away_team} — FAS ${peakFAS}`,
      description: `Full post-match fan report. Who watched, who cheered, who cared most.`,
      images: [`/api/og?match=${slug}&type=report`],
    },
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

export default async function MatchReportPage({ params }: Props) {
  const { slug } = await params
  const report = await getMatchReport(slug)

  if (!report?.event) {
    return (
      <div style={{ minHeight:'100vh', background:'#04050a', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', fontFamily:"'Syne',sans-serif" }}>
        Match not found. <Link href="/globe" style={{ color:'#39FF76', marginLeft:8 }}>Go to globe →</Link>
      </div>
    )
  }

  const { event, snapshots, cheers = [] } = report
  const peakFAS = snapshots.reduce((m, s) => Math.max(m, s.fas_score ?? 0), 0)
  const peakFASLabel = snapshots.find(s => s.fas_score === peakFAS)?.fas_label ?? 'Tepid'
  const peakFans = snapshots.reduce((m, s) => Math.max(m, s.total ?? 0), 0)
  const lastSnap = snapshots[snapshots.length - 1]

  const totalPulse = lastSnap ? VIBES.reduce((s, v) => s + ((lastSnap[`pulse_${v.key}` as keyof typeof lastSnap] as number) ?? 0), 0) : 0

  // Top city across all snapshots
  const cityTotals: Record<string, { count: number; flag?: string }> = {}
  for (const s of snapshots) {
    if (!s.city_counts || typeof s.city_counts !== 'object') continue
    for (const [city, count] of Object.entries(s.city_counts as Record<string, number>)) {
      if (!cityTotals[city]) cityTotals[city] = { count: 0 }
      cityTotals[city].count = Math.max(cityTotals[city].count, Number(count))
    }
  }
  const topCities = Object.entries(cityTotals).sort((a, b) => b[1].count - a[1].count).slice(0, 8)

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif" }}>
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:10 }}>
        <Link href="/globe" style={{ fontSize:14, fontWeight:800, color:'#fff', textDecoration:'none' }}>
          fanglobe<span style={{ color:'#39FF76' }}>.live</span>
        </Link>
        <Link href={`/match/${slug}`} style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
          Match page →
        </Link>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'40px 20px 60px' }}>
        {/* Hero */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#39FF76', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            ✓ Match Report · Post-Match
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, lineHeight:1.1, marginBottom:10, letterSpacing:-1 }}>
            {event.home_flag} {event.home_team} <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.6em' }}>vs</span> {event.away_team} {event.away_flag}
          </h1>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontFamily:"'JetBrains Mono',monospace" }}>
            {new Date(event.kickoff_at).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} · {event.venue}
          </div>
        </div>

        {/* Peak FAS — the headline stat */}
        <div style={{ marginBottom:28, padding:'28px 24px', background:`linear-gradient(135deg, ${fasColor(peakFAS)}12 0%, transparent 70%)`, border:`1px solid ${fasColor(peakFAS)}33`, borderRadius:18, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:64, fontWeight:800, color:fasColor(peakFAS), fontFamily:"'JetBrains Mono',monospace", lineHeight:1, textShadow:`0 0 40px ${fasColor(peakFAS)}55` }}>
              {peakFAS}
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:fasColor(peakFAS), letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>
              Peak FAS · {peakFASLabel}
            </div>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
              This match reached <strong style={{ color:'#fff' }}>{peakFASLabel}</strong> on the FanGlobe Atmosphere Score — a 0 to 100 composite of global fan energy across {topCities.length} cities and {fmt(peakFans)} viewers.
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:32 }}>
          {[
            { label:'Peak viewers', value: fmt(peakFans) },
            { label:'Cities engaged', value: `${topCities.length}` },
            { label:'Total fan votes', value: fmt(totalPulse) },
          ].map((s, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Emotion breakdown */}
        {totalPulse > 0 && lastSnap && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
              Emotion arc
            </div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ display:'flex', height:10, borderRadius:100, overflow:'hidden', gap:2, marginBottom:12 }}>
                {VIBES.map(v => {
                  const count = ((lastSnap[`pulse_${v.key}` as keyof typeof lastSnap] as number) ?? 0)
                  const pct = totalPulse > 0 ? (count / totalPulse) * 100 : 0
                  if (pct <= 0) return null
                  return <div key={v.key} style={{ width:`${pct}%`, background:v.color, borderRadius:100 }} />
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                {VIBES.map(v => {
                  const count = ((lastSnap[`pulse_${v.key}` as keyof typeof lastSnap] as number) ?? 0)
                  const pct = totalPulse > 0 ? Math.round((count / totalPulse) * 100) : 0
                  return (
                    <div key={v.key} style={{ display:'flex', alignItems:'center', gap:6 }}>
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

        {/* Top cities */}
        {topCities.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
              🏆 Loudest cities
            </div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden' }}>
              {topCities.map(([city, data], i) => (
                <div key={city} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom: i < topCities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ minWidth:22, fontSize:12, fontWeight:800, color: i === 0 ? '#FFD166' : i === 1 ? 'rgba(200,200,200,0.7)' : i === 2 ? 'rgba(180,120,80,0.8)' : 'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace" }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </div>
                  <div style={{ flex:1, fontSize:13, fontWeight:600, color:'#fff' }}>{city}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#39FF76', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(data.count)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best cheers */}
        {cheers.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
              💬 Voices from the globe
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {cheers.slice(0, 5).map((c, i) => {
                const vibe = VIBES.find(v => v.key === c.vibe)
                return (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${vibe?.color ?? 'rgba(255,255,255,0.08)'}22`, borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                      <span style={{ fontSize:12 }}>{c.flag}</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{c.city}</span>
                      {vibe && <span style={{ fontSize:9, fontWeight:700, color:vibe.color, letterSpacing:'1px', textTransform:'uppercase', marginLeft:'auto' }}>{vibe.label}</span>}
                    </div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.5 }}>{c.text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Share CTA */}
        <div style={{ textAlign:'center', padding:'24px 20px', background:'rgba(57,255,118,0.05)', border:'1px solid rgba(57,255,118,0.15)', borderRadius:16 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:8 }}>
            Share this match report
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:18 }}>
            The first data-backed way to measure a match's atmosphere.
          </div>
          <Link href="/globe" style={{
            display:'inline-block', background:'#39FF76', color:'#000',
            fontWeight:800, fontSize:13, padding:'11px 26px', borderRadius:100,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
          }}>
            Watch the next match →
          </Link>
        </div>
      </div>
    </div>
  )
}
