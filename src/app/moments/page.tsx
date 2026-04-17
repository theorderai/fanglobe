import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createServiceClient } from '@/lib/supabase-server'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Clutch Moments — The Most Electric Sports Moments | FanGlobe',
  description: 'Auto-captured highlights from every match. Each moment shows the globe, the emotion, and the loudest cities at that exact second.',
  openGraph: {
    title: 'Clutch Moments — Sports Emotion, Captured',
    description: 'The most-shared moments from every match.',
    images: ['/api/og?type=moments'],
  },
}

async function getMoments() {
  try {
    const supabase = createServiceClient()
    const { data: moments } = await supabase
      .from('clutch_moments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24)

    if (!moments?.length) return { moments: [], events: new Map() }

    const matchIds = [...new Set(moments.map(m => m.match_id))]
    const { data: events } = await supabase
      .from('events').select('slug, home_team, away_team, home_flag, away_flag').in('slug', matchIds)
    const eventMap = new Map((events ?? []).map(e => [e.slug, e]))

    return { moments, events: eventMap }
  } catch (err) {
    console.error('moments error:', err)
    return { moments: [], events: new Map() }
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function MomentsPage() {
  const { moments, events } = await getMoments()

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex:1, maxWidth:980, margin:'0 auto', padding:'40px 20px', width:'100%' }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#ff6b35', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            ✨ Clutch moments
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, lineHeight:1.1, marginBottom:12, letterSpacing:-1 }}>
            Sports emotion, captured forever
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6, maxWidth:620 }}>
            Every goal, red card, and eruption on the globe generates a shareable moment card. Fans screenshot these. Broadcasters quote them. This is the feed.
          </p>
        </div>

        {moments.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
            <div style={{ fontSize:40, marginBottom:14, opacity:0.3 }}>✨</div>
            <div style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>No moments captured yet</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:24, maxWidth:320, margin:'0 auto 24px', lineHeight:1.6 }}>
              Moments are auto-generated during live matches when the globe erupts, goals happen, or FAS peaks.
            </div>
            <Link href="/globe" style={{
              display:'inline-block', background:'#ff6b35', color:'#fff',
              fontWeight:800, fontSize:13, padding:'11px 26px', borderRadius:100,
              textDecoration:'none', fontFamily:"'Syne',sans-serif",
            }}>Watch live globe →</Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {moments.map(m => {
              const event = events.get(m.match_id)
              const color = fasColor(m.fas_score)
              return (
                <Link key={m.id} href={`/moment/${m.short_id}`} style={{ textDecoration:'none', color:'inherit' }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${color}12 0%, transparent 70%)`,
                    border: `1px solid ${color}33`,
                    borderRadius: 14, padding:'16px 16px 14px',
                    transition:'all 0.2s',
                    cursor:'pointer',
                    height:'100%',
                    display:'flex', flexDirection:'column',
                  }}>
                    <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{m.title}</div>
                    {event && (
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600, marginBottom:10 }}>
                        {event.home_flag} {event.home_team.split(' ').slice(-1)[0]} v {event.away_team.split(' ').slice(-1)[0]} {event.away_flag}
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                        <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px' }}>FAS</span>
                        <span style={{ fontSize:22, fontWeight:800, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{m.fas_score}</span>
                      </div>
                      <div style={{ width:1, height:18, background:'rgba(255,255,255,0.1)' }} />
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontFamily:"'JetBrains Mono',monospace" }}>
                        {fmt(m.fans_at_moment)} fans
                      </div>
                    </div>

                    {m.top_city && (
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:'auto', paddingBottom:10 }}>
                        🏆 {m.top_city} loudest
                      </div>
                    )}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:"'JetBrains Mono',monospace", marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <span>{timeAgo(m.created_at)}</span>
                      <span>{m.view_count ?? 0} views</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
