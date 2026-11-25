import { NextRequest, NextResponse } from 'next/server'
import { BUCKET_SEC, cronGate, getTapSeries } from '@/lib/redis'
import { feedEnabled, syncFixtures, syncLive } from '@/lib/feed'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Runs every minute (vercel.json). No fake data, no generated content:
 *  1. hourly: sync fixtures from the feed (if configured)
 *  2. every run: poll live matches + open incidents from feed events
 *  3. every run: persist the last few minutes of tap buckets for live matches
 *  4. hourly: close voting on incidents from matches that ended over 24h ago
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const result: Record<string, unknown> = { feed: feedEnabled() }

  if (feedEnabled()) {
    try {
      if (await cronGate('fixtures', 3600)) result.fixtures = await syncFixtures()
      result.live = await syncLive()
    } catch (err) {
      console.error('feed sync failed:', err)
      result.feedError = String(err)
    }
  }

  // Persist the timeseries so it survives Redis TTLs and powers post-match reports.
  const { data: live } = await supabase.from('matches').select('id').eq('status', 'live')
  let persisted = 0
  for (const { id } of live ?? []) {
    const { startBucket, counts } = await getTapSeries(id, 12) // last 2 minutes
    const rows = counts
      .map((taps, i) => ({ match_id: id, bucket_at: new Date((startBucket + i) * BUCKET_SEC * 1000).toISOString(), taps }))
      .slice(0, -1) // current bucket is still filling
      .filter(r => r.taps > 0)
    if (!rows.length) continue
    const { error } = await supabase.from('reaction_buckets').upsert(rows, { onConflict: 'match_id,bucket_at' })
    if (!error) persisted += rows.length
  }
  result.bucketsPersisted = persisted

  if (await cronGate('close-incidents', 3600)) {
    const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString()
    const { data: ended } = await supabase.from('matches').select('id')
      .eq('status', 'finished').lt('updated_at', cutoff).limit(500)
    const ids = (ended ?? []).map(m => m.id)
    if (ids.length) {
      await supabase.from('incidents').update({ status: 'closed', closed_at: new Date().toISOString() })
        .in('match_id', ids).eq('status', 'open')
    }
    result.closedFor = ids.length
  }

  return NextResponse.json(result)
}
