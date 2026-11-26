'use client'
import { useCallback, useState } from 'react'
import type { MatchFeed, Side, Verdict } from '@/types'
import { useAuthContext } from './AuthProvider'
import { useMatchFeed } from '@/hooks/useMatchFeed'
import { useLocalState } from '@/hooks/useLocalState'
import { postJson } from '@/lib/api-client'
import { scoreOrTime } from '@/lib/format'
import IncidentCard, { type MyVote } from './IncidentCard'
import TapTimeline from './TapTimeline'

export default function MatchLive({ initial }: { initial: MatchFeed }) {
  const matchId = initial.match.id
  const { feed, refresh, setFeed } = useMatchFeed(matchId, initial)
  const { accessToken, loading } = useAuthContext()
  const [side, setSide] = useLocalState<Side | null>(`fg:side:${matchId}`, null)
  const [votes, setVotes] = useLocalState<Record<string, MyVote>>(`fg:votes:${matchId}`, {})
  const [toast, setToast] = useState<string | null>(null)
  const [tapCool, setTapCool] = useState(false)
  const [vent, setVent] = useState('')
  const [ventBusy, setVentBusy] = useState(false)

  const flash = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(t => (t === msg ? null : t)), 3500)
  }, [])

  if (!feed) return null
  const { match, incidents, taps, vents } = feed
  const live = match.status === 'live'

  async function pickSide(s: Side) {
    const r = await postJson<{ side?: Side; error?: string }>('/api/side', { matchId, side: s }, accessToken)
    if (r.ok || r.status === 409) setSide(r.data.side ?? s)
    else flash(r.data.error ?? 'Could not save your side')
  }

  async function vote(incidentId: string, verdict: Verdict, anger: number) {
    if (!side) await pickSide('neutral')
    const r = await postJson<{ incident?: MatchFeed['incidents'][number]; error?: string; code?: string }>(
      '/api/verdict', { incidentId, verdict, anger }, accessToken)
    if (r.ok || r.data.code === 'ALREADY_VOTED') {
      setVotes({ ...votes, [incidentId]: { verdict, anger } })
      if (r.data.incident && feed) {
        const updated = r.data.incident
        setFeed({ ...feed, incidents: feed.incidents.map(i => (i.id === updated.id ? updated : i)) })
      }
    } else {
      flash(r.data.error ?? 'Vote failed, try again')
    }
  }

  async function badCall() {
    setTapCool(true)
    setTimeout(() => setTapCool(false), 5000)
    const r = await postJson<{ spike?: boolean; error?: string }>('/api/react', { matchId }, accessToken)
    if (!r.ok) flash(r.data.error ?? 'Could not send')
    else if (r.data.spike) { flash('Fans are flagging this. Verdict is open.'); refresh() }
    else flash('Flagged. If enough fans agree, a verdict opens.')
  }

  async function sendVent() {
    const text = vent.trim()
    if (!text) return
    setVentBusy(true)
    const latestOpen = incidents.find(i => i.status === 'open')
    const r = await postJson<{ approved?: boolean; error?: string }>(
      '/api/vent', { matchId, incidentId: latestOpen?.id ?? null, text }, accessToken)
    setVentBusy(false)
    if (!r.ok) { flash(r.data.error ?? 'Could not post'); return }
    setVent('')
    flash(r.data.approved ? 'Posted.' : 'Not posted: keep it about the decision, not the person.')
    if (r.data.approved) refresh()
  }

  async function share(shortId: string) {
    const url = `${window.location.origin}/i/${shortId}`
    const inc = incidents.find(i => i.shortId === shortId)
    const text = inc ? `${inc.summary.headline}. ${match.homeTeam} v ${match.awayTeam}` : 'Fan verdict'
    if (navigator.share) {
      try { await navigator.share({ url, text }); return } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); flash('Link copied') } catch { flash(url) }
  }

  const sideLabel = (s: Side) => (s === 'home' ? match.homeTeam : s === 'away' ? match.awayTeam : 'Neutral')

  return (
    <>
      <div className="scoreboard">
        <div className="team home">{match.homeTeam}</div>
        {/* Kickoff time is formatted in the server's timezone, then the viewer's. */}
        <div className="score" suppressHydrationWarning>{scoreOrTime(match)}</div>
        <div className="team">{match.awayTeam}</div>
      </div>
      <div className="row" style={{ justifyContent: 'center', marginBottom: 20 }}>
        {live && <span className="pill pill-live">Live{match.minute ? ` · ${match.minute}'` : ''}</span>}
        {match.status === 'finished' && <span className="pill subtle">Full time</span>}
        {match.status === 'upcoming' && <span className="pill subtle">Not started</span>}
        {match.competition && <span className="subtle" style={{ fontSize: 13 }}>{match.competition}</span>}
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <section className="card stack" aria-label="Pick your side">
          {side ? (
            <div className="spread">
              <span>You&apos;re watching as <b>{sideLabel(side)}</b>{side !== 'neutral' ? ' fan' : ''}</span>
              <span className="subtle" style={{ fontSize: 12 }}>locked for this match</span>
            </div>
          ) : (
            <>
              <div><b>Who are you with?</b> <span className="muted">Your verdicts count for this side. Locked once picked.</span></div>
              <div className="side-picker">
                {(['home', 'neutral', 'away'] as Side[]).map(s => (
                  <button key={s} className="side-option" disabled={loading} aria-pressed={false} onClick={() => pickSide(s)}>
                    {sideLabel(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {live && <TapTimeline taps={taps} incidents={incidents} />}

        <section className="stack" aria-label="Decisions">
          {incidents.length === 0 && (
            <div className="card muted">
              {live
                ? 'No big decisions yet. Hit “Bad call!” the moment the ref gets one wrong.'
                : match.status === 'upcoming'
                  ? 'Verdicts open when the match kicks off.'
                  : 'No decisions were put to the fans in this match.'}
            </div>
          )}
          {incidents.map(i => (
            <IncidentCard key={i.id} incident={i} match={match} myVote={votes[i.id] ?? null}
              onVote={(v, a) => vote(i.id, v, a)} onShare={() => share(i.shortId)} />
          ))}
        </section>

        {(live || vents.length > 0) && (
          <section className="card" aria-label="Fan vents">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Fan vents</div>
            {live && (
              <form className="vent-box" onSubmit={e => { e.preventDefault(); sendVent() }}>
                <input value={vent} maxLength={200} onChange={e => setVent(e.target.value)}
                  placeholder="Say it about the decision…" aria-label="Your vent" />
                <button className="btn" disabled={ventBusy || !vent.trim()}>Post</button>
              </form>
            )}
            <div style={{ marginTop: 8 }}>
              {vents.map(v => (
                <div className="vent" key={v.id}>
                  <span className="subtle mono" style={{ fontSize: 11, marginRight: 8 }}>{sideLabel(v.side).toUpperCase()}</span>
                  {v.text}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {toast && (
        <div role="status" className="card" style={{
          position: 'fixed', left: '50%', bottom: live ? 92 : 20, transform: 'translateX(-50%)',
          zIndex: 30, padding: '10px 14px', fontSize: 14, maxWidth: 'calc(100% - 32px)',
        }}>{toast}</div>
      )}

      {live && (
        <div className="badcall-dock">
          <button className="badcall" onClick={badCall} disabled={tapCool || loading}>
            🚩 {tapCool ? 'Flagged' : 'Bad call!'}
          </button>
        </div>
      )}
    </>
  )
}
