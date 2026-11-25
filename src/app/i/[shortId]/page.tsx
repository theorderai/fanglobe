import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import VerdictSplit from '@/components/VerdictSplit'
import { getIncidentByShortId } from '@/lib/db'
import { KIND_EMOJI, KIND_LABEL } from '@/types'

export const revalidate = 15

export async function generateMetadata({ params }: { params: { shortId: string } }): Promise<Metadata> {
  const found = await getIncidentByShortId(params.shortId)
  if (!found) return { title: 'Verdict not found — FanGlobe' }
  const { incident, match } = found
  const title = incident.summary.headline
  const description = `${match.homeTeam} v ${match.awayTeam}${incident.minute ? `, ${incident.minute}'` : ''}: ${incident.title}. Ref's call: ${incident.refCall}. Cast your verdict.`
  const image = `/api/og/incident/${incident.shortId}`
  return {
    title: `${title} — FanGlobe`,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

/** Shareable page for one decision. This is what links on X/WhatsApp land on. */
export default async function IncidentPage({ params }: { params: { shortId: string } }) {
  const found = await getIncidentByShortId(params.shortId)
  if (!found) notFound()
  const { incident, match } = found

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingTop: 24 }}>
        <div className="stack" style={{ gap: 16 }}>
          <Link href={`/m/${match.id}`} className="muted" style={{ fontSize: 14 }}>
            ← {match.homeTeam} v {match.awayTeam}
          </Link>
          <article className="card stack" style={{ gap: 14 }}>
            <span className="eyebrow">
              {KIND_EMOJI[incident.kind]} {KIND_LABEL[incident.kind]}{incident.minute ? ` · ${incident.minute}'` : ''}
            </span>
            <div>
              <h1 className="incident-title" style={{ fontSize: 22 }}>{incident.title}</h1>
              <div className="incident-call">Ref&apos;s call: {incident.refCall}</div>
            </div>
            <VerdictSplit summary={incident.summary} match={match} />
          </article>
          {incident.status === 'open' && (
            <Link href={`/m/${match.id}#i-${incident.shortId}`} className="btn btn-primary btn-block">
              Cast your verdict
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
