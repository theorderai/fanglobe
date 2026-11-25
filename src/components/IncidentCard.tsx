'use client'
import { useState } from 'react'
import type { IncidentWithSummary, Match, Verdict } from '@/types'
import { KIND_EMOJI, KIND_LABEL } from '@/types'
import VerdictSplit from './VerdictSplit'

const ANGER = ['😐', '😒', '😤', '😡', '🤬']

export interface MyVote { verdict: Verdict; anger: number }

export default function IncidentCard({ incident, match, myVote, onVote, onShare }: {
  incident: IncidentWithSummary
  match: Match
  myVote: MyVote | null
  onVote: (verdict: Verdict, anger: number) => Promise<void>
  onShare: () => void
}) {
  const [pending, setPending] = useState<Verdict | null>(null)
  const [busy, setBusy] = useState(false)
  const open = incident.status === 'open'
  const showResults = Boolean(myVote) || !open

  async function submit(anger: number) {
    if (!pending) return
    setBusy(true)
    try { await onVote(pending, anger) } finally { setBusy(false); setPending(null) }
  }

  return (
    <article className={`card incident${open && !myVote ? ' open' : ''}`} id={`i-${incident.shortId}`}>
      <div className="spread">
        <span className="eyebrow">
          {KIND_EMOJI[incident.kind]} {KIND_LABEL[incident.kind]}
          {incident.minute ? ` · ${incident.minute}'` : ''}
          {incident.source === 'crowd' ? ' · flagged by fans' : ''}
        </span>
        {!open && <span className="pill subtle">Voting closed</span>}
      </div>

      <div>
        <h3 className="incident-title">{incident.title}</h3>
        <div className="incident-call">Ref&apos;s call: {incident.refCall}</div>
      </div>

      {!showResults && !pending && (
        <div className="vote-grid">
          <button className="btn btn-right" onClick={() => setPending('right')}>✓ Right call</button>
          <button className="btn btn-wrong" onClick={() => setPending('wrong')}>✗ Wrong call</button>
        </div>
      )}

      {!showResults && pending && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="muted" style={{ fontSize: 14 }}>
            {pending === 'wrong' ? 'Wrong call.' : 'Right call.'} How angry are you?
          </div>
          <div className="anger-row">
            {ANGER.map((e, i) => (
              <button key={e} disabled={busy} onClick={() => submit(i + 1)} aria-label={`Anger ${i + 1} of 5`}>{e}</button>
            ))}
          </div>
          <button className="btn btn-sm" disabled={busy} onClick={() => setPending(null)}>Back</button>
        </div>
      )}

      {showResults && (
        <>
          <VerdictSplit summary={incident.summary} match={match} />
          <div className="spread">
            <span className="subtle" style={{ fontSize: 13 }}>
              {myVote ? `You said: ${myVote.verdict === 'wrong' ? 'wrong call' : 'right call'} ${ANGER[myVote.anger - 1] ?? ''}` : ''}
            </span>
            <button className="btn btn-sm" onClick={onShare}>Share verdict</button>
          </div>
        </>
      )}
    </article>
  )
}
