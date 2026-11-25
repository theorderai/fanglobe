import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getIncidentByShortId } from '@/lib/db'
import { KIND_LABEL } from '@/types'

export const runtime = 'nodejs'

const LABEL_COLOR: Record<string, string> = {
  'Robbery': '#ff4d4f',
  'Controversial': '#ff9f1c',
  'Debatable': '#ffd166',
  'Fair call': '#39ff76',
  'Too early': '#9aa4b2',
}

/** 1200×630 verdict card for X / WhatsApp / Instagram link previews. */
export async function GET(_req: NextRequest, { params }: { params: { shortId: string } }) {
  const found = await getIncidentByShortId(params.shortId)
  if (!found) return new Response('Not found', { status: 404 })
  const { incident, match } = found
  const s = incident.summary
  const color = LABEL_COLOR[s.label] ?? '#ffffff'

  const bar = (label: string, n: number, pct: number, c: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#cbd5e1' }}>
        <span>{label}</span><span>{n ? `${pct}% wrong` : '—'}</span>
      </div>
      <div style={{ display: 'flex', height: 14, marginTop: 10, borderRadius: 7, background: '#1f2937', overflow: 'hidden' }}>
        <div style={{ width: `${n ? pct : 0}%`, background: c }} />
      </div>
    </div>
  )

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#05080d', padding: '56px 64px', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: '#94a3b8' }}>
          <span>{match.homeTeam} v {match.awayTeam}{incident.minute ? ` · ${incident.minute}'` : ''}</span>
          <span style={{ color: '#39ff76', fontWeight: 700 }}>FanGlobe Verdict</span>
        </div>

        <div style={{ display: 'flex', marginTop: 36, fontSize: 30, color: '#94a3b8' }}>
          {KIND_LABEL[incident.kind]} · Ref&apos;s call: {incident.refCall}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 58, fontWeight: 800, lineHeight: 1.1 }}>
          {s.headline}
        </div>

        <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 40 }}>
            {bar(match.homeTeam, s.home.n, s.home.wrongPct, match.homeColor ?? '#60a5fa')}
            {bar('Neutrals', s.neutral.n, s.neutral.wrongPct, '#e2e8f0')}
            {bar(match.awayTeam, s.away.n, s.away.wrongPct, match.awayColor ?? '#f472b6')}
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 36, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#05080d', background: color, padding: '6px 18px', borderRadius: 10 }}>
              {s.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 26, color: '#94a3b8' }}>{s.total.toLocaleString()} fan verdicts</span>
          </div>
          <span style={{ fontSize: 26, color: '#94a3b8' }}>fanglobe.live · cast yours</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    },
  )
}
