import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import MatchLive from '@/components/MatchLive'
import { buildFeed, getMatch } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const match = await getMatch(params.id)
  if (!match) return { title: 'Match not found — FanGlobe' }
  const title = `${match.homeTeam} v ${match.awayTeam} — live fan verdicts`
  const description = `Was the ref right? Rule on every big decision in ${match.homeTeam} v ${match.awayTeam} and see what neutral fans think.`
  return { title, description, openGraph: { title, description }, twitter: { card: 'summary_large_image', title, description } }
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const feed = await buildFeed(params.id)
  if (!feed) notFound()
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 40 }}>
        <MatchLive initial={feed} />
      </main>
      <SiteFooter />
    </>
  )
}
