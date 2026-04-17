import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getExpectedReach } from '@/lib/events'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matchSlug = searchParams.get('match') ?? ''
  const type = searchParams.get('type') ?? 'match'
  const city = searchParams.get('city') ?? ''
  const rank = parseInt(searchParams.get('rank') ?? '0') || 0
  const flag = searchParams.get('flag') ?? '📍'
  const count = parseInt(searchParams.get('count') ?? '0') || 0

  let homeTeam = 'FanGlobe', awayTeam = 'Live Fan Tracker'
  let homeFlag = '🌍', awayFlag = '⚽'
  let reach = 0, fas = 0, fasLabel = ''

  try {
    const supabase = createServiceClient()
    if (matchSlug) {
      const { data } = await supabase.from('events').select('*').eq('slug', matchSlug).single()
      if (data) {
        homeTeam = data.home_team; awayTeam = data.away_team
        homeFlag = data.home_flag; awayFlag = data.away_flag
      }
      reach = getExpectedReach(matchSlug)
      const { data: snap } = await supabase.from('snapshots').select('fas_score, fas_label, total').eq('match_id', matchSlug).order('snapped_at', { ascending: false }).limit(1).single()
      if (snap) { fas = snap.fas_score ?? 0; fasLabel = snap.fas_label ?? ''; reach = snap.total || reach }
    }
  } catch {}

  const accent = '#39FF76'

  // ── CITY CARD — viral share for "my city is #N" moment ──────────────────
  if (type === 'citycard' && city) {
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''
    const rankColor = rank === 1 ? '#FFD166' : rank === 2 ? '#D4D4D4' : rank === 3 ? '#B87333' : accent

    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#04050a', padding: '60px 64px', fontFamily: 'sans-serif', position: 'relative' }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${rankColor}22 0%, transparent 60%)`, transform: 'translateX(-50%)', display: 'flex' }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>fanglobe.live</div>
        </div>

        {/* Hero: city + rank */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 110, marginBottom: 4 }}>{flag}</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: -2 }}>
            {city}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: rankColor, display: 'flex', alignItems: 'center' }}>
              {rankEmoji} #{rank} globally
            </div>
          </div>
          {count > 0 && (
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', marginTop: 14, display: 'flex' }}>
              {fmt(count)} fans watching · {homeTeam} vs {awayTeam}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 'auto', paddingTop: 40 }}>
          <div style={{ background: accent, color: '#000', fontWeight: 800, fontSize: 18, padding: '12px 28px', borderRadius: 100, display: 'flex' }}>
            📍 Drop your pin
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
            Help {city} climb the leaderboard
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  // ── DEFAULT MATCH CARD ───────────────────────────────────────────────────
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#04050a', padding: '40px 48px', fontFamily: 'sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: -100, left: '50%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,118,0.08) 0%, transparent 70%)', transform: 'translateX(-50%)', display: 'flex' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>fanglobe.live</div>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 2, textTransform: 'uppercase' }}>Global Fan Tracker</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 64 }}>{homeFlag}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{homeTeam}</div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 64 }}>{awayFlag}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{awayTeam}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>{fmt(reach)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>fans watching</div>
        </div>
        {fas > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: fas >= 70 ? accent : fas >= 45 ? '#ffd166' : 'rgba(255,255,255,0.5)' }}>{fas}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/ 100</div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>FAS · {fasLabel}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        <div style={{ background: accent, color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 20px', borderRadius: 100, display: 'flex' }}>
          📍 Drop your pin
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>fanglobe.live/match/{matchSlug}</div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}