import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 0

interface PulseBucket {
  ts: string
  fire: number
  ecstatic: number
  nervous: number
  crushed: number
  total: number
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const matchId = url.searchParams.get('matchId')
    if (!matchId) return NextResponse.json({ buckets: [] })

    const supabase = createServiceClient()
    const since = new Date(Date.now() - 60 * 1000).toISOString()

    const { data } = await supabase
      .from('match_pulse')
      .select('bucket_ts, fire_count, ecstatic_count, nervous_count, crushed_count, total')
      .eq('match_id', matchId)
      .gte('bucket_ts', since)
      .order('bucket_ts', { ascending: true })

    const buckets: PulseBucket[] = (data ?? []).map(r => ({
      ts: r.bucket_ts,
      fire: r.fire_count ?? 0,
      ecstatic: r.ecstatic_count ?? 0,
      nervous: r.nervous_count ?? 0,
      crushed: r.crushed_count ?? 0,
      total: r.total ?? 0,
    }))

    return NextResponse.json({ buckets }, {
      headers: { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=5' }
    })
  } catch (err) {
    console.error('pulse GET error:', err)
    return NextResponse.json({ buckets: [] })
  }
}
