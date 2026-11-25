import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import MatchList from '@/components/MatchList'
import { listMatches } from '@/lib/db'

export const revalidate = 30

export default async function Home() {
  const { live, upcoming, recent } = await listMatches().catch(() => ({ live: [], upcoming: [], recent: [] }))
  const nothing = !live.length && !upcoming.length && !recent.length

  return (
    <>
      <SiteHeader />
      <main className="container">
        <section className="hero">
          <div className="eyebrow" style={{ marginBottom: 14 }}>The fans’ VAR</div>
          <h1>Was that the <em>right call?</em></h1>
          <p>
            Every big refereeing decision gets a live fan verdict. Pick your side, rule on the call,
            and see what neutral fans really think, seconds after it happens.
          </p>
        </section>

        <section className="section" id="live">
          {live.length > 0 && (
            <>
              <h2><span className="pill pill-live">Live now</span></h2>
              <MatchList matches={live} />
            </>
          )}
          {upcoming.length > 0 && (
            <div style={{ marginTop: live.length ? 28 : 0 }}>
              <h2>Coming up</h2>
              <MatchList matches={upcoming.slice(0, 20)} />
            </div>
          )}
          {recent.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h2>Recent verdicts</h2>
              <MatchList matches={recent.slice(0, 20)} />
            </div>
          )}
          {nothing && (
            <div className="card muted">No matches scheduled this week yet. Check back on matchday.</div>
          )}
        </section>

        <section className="section" id="how">
          <h2>How it works</h2>
          <div className="steps">
            <div className="card"><b>1. Pick your side</b>Home, away, or neutral. It’s locked for the match.</div>
            <div className="card"><b>2. Rule on the call</b>When a big decision lands, say right or wrong and how angry you are.</div>
            <div className="card"><b>3. See the split</b>Fans of each team, and the neutral verdict that cuts through tribalism.</div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
