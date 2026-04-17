import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createServiceClient } from '@/lib/supabase-server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'FAS Weekly Report — The Most Electric Sports Moments',
  description: 'Top matches of the week by FanGlobe Atmosphere Score.',
  openGraph: {
    title: 'FAS Weekly — The Electric Sports Report',
    description: 'Top matches, loudest cities, biggest emotional swings.',
    images: ['/api/og?type=fas-weekly'],
  },
}

interface TopMatch {
  slug: string; matchId: string
  homeTeam: string; awayTeam: string
  homeFlag: string; awayFlag: string
  fasScore: number; fasLabel: string
  totalFans: number; topCity?: string
}

async function getWeekData(): Promise<{ topMatches: TopMatch[]; totalFans: number; matchCount: number }> {
  try {
    const supabase = createServiceClient()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const { data: snaps } = await supabase
      .from('snapshots')
      .select('match_id, fas_score, fas_label, total, city_counts')
      .gte('snapped_at', weekAgo)
      .order('fas_score', { ascending: false })
      .limit(500)

    if (!snaps?.length) return { topMatches: [], totalFans: 0, matchCount: 0 }

    const best = new Map<string, typeof snaps[0]>()
    for (const s of snaps) {
      const existing = best.get(s.match_id)
      if (!existing || (s.fas_score ?? 0) > (existing.fas_score ?? 0)) best.set(s.match_id, s)
    }

    const matchIds = [...best.keys()]
    const { data: events } = await supabase
      .from('events')
      .select('id, slug, home_team, away_team, home_flag, away_flag')
      .in('slug', matchIds)

    const eventMap = new Map((events ?? []).map(e => [e.slug, e]))

    const topMatches: TopMatch[] = [...best.values()]
      .sort((a, b) => (b.fas_score ?? 0) - (a.fas_score ?? 0))
      .slice(0, 10)
      .map(s => {
        const ev = eventMap.get(s.match_id)
        const cityCounts = (typeof s.city_counts === 'object' && s.city_counts) ? s.city_counts as Record<string, number> : {}
        const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
        return {
          slug: s.match_id, matchId: s.match_id,
          homeTeam: ev?.home_team ?? 'Home', awayTeam: ev?.away_team ?? 'Away',
          homeFlag: ev?.home_flag ?? '⚽', awayFlag: ev?.away_flag ?? '⚽',
          fasScore: s.fas_score ?? 0, fasLabel: s.fas_label ?? 'Tepid',
          totalFans: s.total ?? 0, topCity,
        }
      })

    const totalFans = topMatches.reduce((s, m) => s + m.totalFans, 0)
    return { topMatches, totalFans, matchCount: best.size }
  } catch (err) {
    console.error('fas/weekly error:', err)
    return { topMatches: [], totalFans: 0, matchCount: 0 }
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

export default async function FASWeeklyPage() {
  const { topMatches, totalFans, matchCount } = await getWeekData()
  const weekEnd = new Date()
  const weekStart = new Date(Date.now() - 7 * 86400000)
  const dateLabel = `${weekStart.toLocaleDateString('en-US', { month:'short', day:'numeric' })} — ${weekEnd.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex:1, maxWidth:760, margin:'0 auto', padding:'40px 20px', width:'100%' }}>
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#39FF76', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            FAS Weekly Report
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, lineHeight:1.1, marginBottom:12, letterSpacing:-1 }}>
            The most electric sports<br />moments of the week
          </h1>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:"'JetBrains Mono',monospace" }}>
            {dateLabel}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:32 }}>
          {[
            { label:'Matches tracked', value: matchCount ? `${matchCount}` : '—' },
            { label:'Global fans', value: totalFans ? fmt(totalFans) : '—' },
            { label:'Highest FAS', value: topMatches[0]?.fasScore ? `${topMatches[0].fasScore}` : '—' },
          ].map((s, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginTop:5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            Top matches by FAS
          </div>
          {topMatches.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
              <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>📡</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Tracking begins on match day</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:20 }}>Check back after the first week of live matches</div>
              <Link href="/globe" style={{
                display:'inline-block', background:'#39FF76', color:'#000',
                fontWeight:800, fontSize:12, padding:'10px 24px', borderRadius:100,
                textDecoration:'none', fontFamily:"'Syne',sans-serif",
              }}>Watch live globe →</Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden' }}>
              {topMatches.map((m, i) => (
                <Link key={m.slug} href={`/match/${m.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom: i < topMatches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor:'pointer' }}>
                    <div style={{ minWidth:24, fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace" }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.homeFlag} {m.homeTeam} <span style={{ color:'rgba(255,255,255,0.3)' }}>vs</span> {m.awayTeam} {m.awayFlag}
                      </div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2, fontFamily:"'JetBrains Mono',monospace" }}>
                        {fmt(m.totalFans)} fans {m.topCity ? `· loudest ${m.topCity}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:fasColor(m.fasScore), fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>
                        {m.fasScore}
                      </div>
                      <div style={{ fontSize:8, fontWeight:700, color:fasColor(m.fasScore), letterSpacing:'1px', textTransform:'uppercase', marginTop:3 }}>
                        {m.fasLabel}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:'24px 20px', background:'rgba(57,255,118,0.05)', border:'1px solid rgba(57,255,118,0.15)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:6 }}>Learn how FAS is calculated</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:16 }}>Our open methodology · 4 weighted components</div>
          <Link href="/fas" style={{
            display:'inline-block', background:'rgba(57,255,118,0.15)', color:'#39FF76',
            fontWeight:700, fontSize:12, padding:'9px 20px', borderRadius:100,
            textDecoration:'none', fontFamily:"'JetBrains Mono',monospace",
            border:'1px solid rgba(57,255,118,0.3)',
          }}>Read the FAS methodology →</Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
