import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createServiceClient } from '@/lib/supabase-server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Oracle Leaderboard — Top Sports Predictors | FanGlobe',
  description: 'Who predicts sports best? The global Oracle Leaderboard ranks every FanGlobe user by prediction accuracy.',
  openGraph: {
    title: 'Oracle Leaderboard — The Best Sports Predictors on Earth',
    description: 'Compete for Oracle status. Predict matches. Earn badges.',
    images: ['/api/og?type=oracle'],
  },
}

interface Oracle {
  sessionId: string
  totalPredictions: number
  correctCount: number
  totalPoints: number
  accuracyPct: number
  displayName: string
}

async function getOracles(): Promise<Oracle[]> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('user_prediction_stats')
      .select('session_id, total_predictions, correct_count, total_points, accuracy_pct')
      .gte('total_predictions', 3)
      .order('total_points', { ascending: false })
      .limit(50)

    if (!data) return []

    return data.map((d, i) => ({
      sessionId: d.session_id,
      totalPredictions: d.total_predictions ?? 0,
      correctCount: d.correct_count ?? 0,
      totalPoints: d.total_points ?? 0,
      accuracyPct: d.accuracy_pct ?? 0,
      displayName: `Oracle #${String(d.session_id).slice(-5).toUpperCase()}`,
    }))
  } catch (err) {
    console.error('oracle error:', err)
    return []
  }
}

const RANKS = [
  { bg: '#FFD166', color: '#412402', label: '🥇' },
  { bg: 'rgba(200,200,200,0.3)', color: 'rgba(255,255,255,0.8)', label: '🥈' },
  { bg: 'rgba(180,130,80,0.3)', color: 'rgba(220,160,90,0.9)', label: '🥉' },
]

export default async function OraclePage() {
  const oracles = await getOracles()

  return (
    <div style={{ minHeight:'100vh', background:'#04050a', color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', flexDirection:'column' }}>
      <SiteHeader />

      <div style={{ flex:1, maxWidth:760, margin:'0 auto', padding:'40px 20px', width:'100%' }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#ffd166', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            🔮 Oracle Leaderboard
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, lineHeight:1.1, marginBottom:12, letterSpacing:-1 }}>
            The best sports predictors<br />on Earth
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
            Predict match outcomes before kickoff. Earn Oracle Points for every correct call. Top predictors climb the global leaderboard.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:8, marginBottom:32 }}>
          {[
            { emoji:'🎯', title:'10 pts', desc:'Correct winner' },
            { emoji:'🎲', title:'25 pts', desc:'Exact scoreline' },
            { emoji:'⚡', title:'50 pts', desc:'3-match parlay' },
            { emoji:'👑', title:'Oracle', desc:'Top 10 per league' },
          ].map((c, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{c.emoji}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#ffd166', fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>{c.title}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            Top predictors · all time
          </div>
          {oracles.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
              <div style={{ fontSize:36, marginBottom:12, opacity:0.4 }}>🔮</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>First Oracle awaiting crown</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:20 }}>Make 3 match predictions to appear on the leaderboard</div>
              <Link href="/globe" style={{
                display:'inline-block', background:'#ffd166', color:'#412402',
                fontWeight:800, fontSize:12, padding:'10px 24px', borderRadius:100,
                textDecoration:'none', fontFamily:"'Syne',sans-serif",
              }}>Make your first prediction →</Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 80px 80px', gap:8, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>
                <span>#</span><span>Oracle</span>
                <span style={{ textAlign:'right' }}>Pts</span>
                <span style={{ textAlign:'right' }}>Acc</span>
              </div>
              {oracles.map((o, i) => {
                const medal = RANKS[i] ?? null
                return (
                  <div key={o.sessionId} style={{
                    display:'grid', gridTemplateColumns:'40px 1fr 80px 80px', gap:8,
                    padding:'12px 16px',
                    borderBottom: i < oracles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i < 3 ? 'rgba(255,209,102,0.03)' : 'transparent',
                  }}>
                    <div style={{ display:'flex', alignItems:'center' }}>
                      {medal ? (
                        <div style={{ fontSize:18 }}>{medal.label}</div>
                      ) : (
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:"'JetBrains Mono',monospace" }}>{i+1}</span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:"'JetBrains Mono',monospace" }}>{o.displayName}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{o.correctCount}/{o.totalPredictions} correct</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                      <span style={{ fontSize:14, fontWeight:800, color:'#ffd166', fontFamily:"'JetBrains Mono',monospace" }}>{o.totalPoints}</span>
                    </div>
                    <div style={{ textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                      <span style={{ fontSize:12, fontWeight:700, color: o.accuracyPct >= 70 ? '#39FF76' : o.accuracyPct >= 50 ? '#ffd166' : 'rgba(255,255,255,0.5)', fontFamily:"'JetBrains Mono',monospace" }}>{o.accuracyPct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', padding:'24px 20px', background:'rgba(255,209,102,0.05)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:6 }}>Become an Oracle</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:18 }}>
            Predict the next match on the globe. Climb the leaderboard.
          </div>
          <Link href="/globe" style={{
            display:'inline-block', background:'#ffd166', color:'#412402',
            fontWeight:800, fontSize:13, padding:'11px 26px', borderRadius:100,
            textDecoration:'none', fontFamily:"'Syne',sans-serif",
          }}>🎯 Predict a match →</Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
