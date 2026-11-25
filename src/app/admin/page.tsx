'use client'
import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { toMatch } from '@/lib/match-row'
import type { IncidentKind, Match, MatchFeed } from '@/types'
import { INCIDENT_KINDS, KIND_LABEL } from '@/types'

/**
 * Ref Desk: run matchday by hand when there's no live feed (or to add
 * decisions the feed misses). Protected by ADMIN_SECRET on every API call.
 */
export default function RefDesk() {
  const [secret, setSecret] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<string>('')
  const [feed, setFeed] = useState<MatchFeed | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { setSecret(sessionStorage.getItem('fg:admin') ?? '') }, [])

  const loadMatches = useCallback(async () => {
    const since = new Date(Date.now() - 3 * 86400_000).toISOString()
    const { data } = await getSupabaseClient().from('matches').select('*')
      .gte('kickoff_at', since).order('kickoff_at', { ascending: true }).limit(100)
    setMatches((data ?? []).map(toMatch))
  }, [])

  const loadFeed = useCallback(async (id: string) => {
    if (!id) { setFeed(null); return }
    const res = await fetch(`/api/match/${encodeURIComponent(id)}`, { cache: 'no-store' })
    setFeed(res.ok ? await res.json() : null)
  }, [])

  useEffect(() => { loadMatches() }, [loadMatches])
  useEffect(() => { loadFeed(selected) }, [selected, loadFeed])

  async function call(body: Record<string, unknown>) {
    setMsg(null)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setMsg(`Error: ${data.error ?? res.status}`); return null }
    setMsg('Saved')
    await loadMatches()
    await loadFeed(selected)
    return data
  }

  const m = matches.find(x => x.id === selected) ?? null

  return (
    <main className="container" style={{ padding: '24px 16px 80px' }}>
      <div className="stack" style={{ gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Ref Desk</h1>

        <label className="field">Admin secret
          <input type="password" value={secret} onChange={e => { setSecret(e.target.value); sessionStorage.setItem('fg:admin', e.target.value) }} />
        </label>
        {msg && <div className="notice">{msg}</div>}

        <CreateMatch onCreate={body => call({ action: 'create_match', ...body })} />

        <label className="field">Match
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select a match…</option>
            {matches.map(x => (
              <option key={x.id} value={x.id}>
                {new Date(x.kickoffAt).toLocaleString()} · {x.homeTeam} v {x.awayTeam} ({x.status})
              </option>
            ))}
          </select>
        </label>

        {m && (
          <>
            <MatchControls match={m} onSave={body => call({ action: 'update_match', id: m.id, ...body })} />
            <CreateIncident match={m} onCreate={body => call({ action: 'create_incident', matchId: m.id, ...body })} />
            <section className="card stack">
              <b>Decisions</b>
              {(feed?.incidents ?? []).map(i => (
                <div key={i.id} className="spread" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <div>
                    <div>{i.minute ? `${i.minute}' ` : ''}{KIND_LABEL[i.kind]}: {i.title}</div>
                    <div className="subtle" style={{ fontSize: 12 }}>
                      {i.source} · {i.status} · {i.summary.total} votes · {i.summary.headline}
                    </div>
                  </div>
                  <div className="row">
                    {i.status === 'open'
                      ? <button className="btn btn-sm" onClick={() => call({ action: 'set_incident', id: i.id, status: 'closed' })}>Close</button>
                      : <button className="btn btn-sm" onClick={() => call({ action: 'set_incident', id: i.id, status: 'open' })}>Reopen</button>}
                    <button className="btn btn-sm" onClick={() => call({ action: 'set_incident', id: i.id, status: 'hidden' })}>Hide</button>
                  </div>
                </div>
              ))}
              {feed && !feed.incidents.length && <div className="muted">None yet.</div>}
            </section>
            <div className="subtle" style={{ fontSize: 13 }}>
              Broadcast overlay: <code>/widget/{m.id}</code> (add <code>?bg=transparent</code> for keying)
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function CreateMatch({ onCreate }: { onCreate: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [f, setF] = useState({ homeTeam: '', awayTeam: '', kickoffAt: '', competition: 'Premier League' })
  const id = [f.homeTeam, f.awayTeam, f.kickoffAt.slice(0, 10)].join('-').toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return (
    <details className="card">
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add a match</summary>
      <div className="stack" style={{ marginTop: 12 }}>
        <div className="grid-2">
          <label className="field">Home team<input value={f.homeTeam} onChange={e => setF({ ...f, homeTeam: e.target.value })} /></label>
          <label className="field">Away team<input value={f.awayTeam} onChange={e => setF({ ...f, awayTeam: e.target.value })} /></label>
          <label className="field">Kickoff (your local time)<input type="datetime-local" value={f.kickoffAt} onChange={e => setF({ ...f, kickoffAt: e.target.value })} /></label>
          <label className="field">Competition<input value={f.competition} onChange={e => setF({ ...f, competition: e.target.value })} /></label>
        </div>
        <div className="subtle" style={{ fontSize: 12 }}>id: {id || '—'}</div>
        <button className="btn btn-primary" disabled={!f.homeTeam || !f.awayTeam || !f.kickoffAt}
          onClick={() => onCreate({ ...f, id, kickoffAt: new Date(f.kickoffAt).toISOString() })}>Create match</button>
      </div>
    </details>
  )
}

function MatchControls({ match, onSave }: { match: Match; onSave: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [minute, setMinute] = useState(String(match.minute ?? ''))
  const [hs, setHs] = useState(String(match.homeScore ?? ''))
  const [as, setAs] = useState(String(match.awayScore ?? ''))
  const num = (s: string) => (s.trim() === '' ? null : parseInt(s, 10))
  return (
    <section className="card stack">
      <div className="spread"><b>{match.homeTeam} v {match.awayTeam}</b><span className="pill">{match.status}</span></div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {(['upcoming', 'live', 'finished'] as const).map(s => (
          <button key={s} className={`btn btn-sm${match.status === s ? ' btn-primary' : ''}`} onClick={() => onSave({ status: s })}>{s}</button>
        ))}
      </div>
      <div className="grid-2">
        <label className="field">Minute<input inputMode="numeric" value={minute} onChange={e => setMinute(e.target.value)} /></label>
        <div className="grid-2">
          <label className="field">{match.homeShort ?? 'Home'}<input inputMode="numeric" value={hs} onChange={e => setHs(e.target.value)} /></label>
          <label className="field">{match.awayShort ?? 'Away'}<input inputMode="numeric" value={as} onChange={e => setAs(e.target.value)} /></label>
        </div>
      </div>
      <button className="btn" onClick={() => onSave({ minute: num(minute), homeScore: num(hs), awayScore: num(as) })}>Update score &amp; minute</button>
    </section>
  )
}

function CreateIncident({ match, onCreate }: { match: Match; onCreate: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [kind, setKind] = useState<IncidentKind>('penalty')
  const [title, setTitle] = useState('')
  const [refCall, setRefCall] = useState('')
  const [minute, setMinute] = useState('')
  const [fav, setFav] = useState<'' | 'home' | 'away'>('')
  return (
    <section className="card stack">
      <b>Put a decision to the fans</b>
      <div className="grid-2">
        <label className="field">Type
          <select value={kind} onChange={e => setKind(e.target.value as IncidentKind)}>
            {INCIDENT_KINDS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <label className="field">Minute (blank = now)<input inputMode="numeric" value={minute} onChange={e => setMinute(e.target.value)} /></label>
      </div>
      <label className="field">What happened<input maxLength={120} placeholder="Saka goes down under Cucurella's challenge" value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="field">The ref&apos;s call<input maxLength={120} placeholder="No penalty, play on" value={refCall} onChange={e => setRefCall(e.target.value)} /></label>
      <label className="field">Who did the call help?
        <select value={fav} onChange={e => setFav(e.target.value as '' | 'home' | 'away')}>
          <option value="">Not clear</option>
          <option value="home">{match.homeTeam}</option>
          <option value="away">{match.awayTeam}</option>
        </select>
      </label>
      <button className="btn btn-primary" disabled={!title.trim() || !refCall.trim()} onClick={async () => {
        const ok = await onCreate({ kind, title, refCall, minute: minute ? parseInt(minute, 10) : null, favouredSide: fav || null })
        if (ok) { setTitle(''); setRefCall(''); setMinute('') }
      }}>Open verdict</button>
    </section>
  )
}
