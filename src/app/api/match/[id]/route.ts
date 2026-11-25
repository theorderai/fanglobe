import { NextRequest, NextResponse } from 'next/server'
import { buildFeed } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Everything a match page, widget or broadcaster needs, in one cacheable call. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const feed = await buildFeed(params.id)
  if (!feed) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  return NextResponse.json(feed, {
    headers: {
      // Thousands of clients poll this; the CDN absorbs it.
      'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=5',
    },
  })
}
