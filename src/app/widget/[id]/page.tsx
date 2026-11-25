'use client'
import { useMatchFeed } from '@/hooks/useMatchFeed'
import VerdictSplit from '@/components/VerdictSplit'
import { KIND_EMOJI, KIND_LABEL } from '@/types'

/**
 * Broadcaster overlay. Embed as an OBS/vMix browser source or an iframe.
 *   /widget/<matchId>                 dark card
 *   /widget/<matchId>?bg=transparent  no background, for keying over video
 * Shows the most recent decision with at least one vote (or the newest one).
 */
export default function Widget({ params, searchParams }: {
  params: { id: string }; searchParams: { bg?: string }
}) {
  const { feed } = useMatchFeed(params.id, null, 3000)
  const transparent = searchParams.bg === 'transparent'
  const incident = feed?.incidents.find(i => i.summary.total > 0) ?? feed?.incidents[0]

  return (
    <div style={{
      minHeight: '100vh', padding: 16,
      background: transparent ? 'transparent' : 'var(--bg)',
    }}>
      <style>{`html, body { background: ${transparent ? 'transparent' : 'var(--bg)'} !important; }`}</style>
      {feed && (
        <div className="card stack" style={{ maxWidth: 520, gap: 12, background: 'rgba(8,12,18,0.92)' }}>
          <div className="spread">
            <span className="eyebrow">Fan verdict · {feed.match.homeTeam} v {feed.match.awayTeam}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>fanglobe.live</span>
          </div>
          {incident ? (
            <>
              <div style={{ fontWeight: 700 }}>
                {KIND_EMOJI[incident.kind]} {incident.minute ? `${incident.minute}' ` : ''}{KIND_LABEL[incident.kind]}: {incident.refCall}
              </div>
              <VerdictSplit summary={incident.summary} match={feed.match} compact />
            </>
          ) : (
            <div className="muted">Waiting for the first big decision…</div>
          )}
        </div>
      )}
    </div>
  )
}
