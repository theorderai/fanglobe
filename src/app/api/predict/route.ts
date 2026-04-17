import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 0

// POST: submit a prediction
export async function POST(req: NextRequest) {
  try {
    const { matchId, sessionId, kind, prediction } = await req.json()
    if (!matchId || !sessionId || !kind || !prediction) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('predictions')
      .upsert({
        match_id: matchId, session_id: sessionId, kind, prediction,
      }, { onConflict: 'session_id,match_id,kind' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('predict error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET: get aggregate predictions + user's own prediction for a match
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const matchId = url.searchParams.get('matchId')
    const sessionId = url.searchParams.get('sessionId')
    if (!matchId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

    const supabase = createServiceClient()

    // Aggregate winner predictions for this match
    const { data: all } = await supabase
      .from('predictions')
      .select('kind, prediction, session_id')
      .eq('match_id', matchId)

    const agg: Record<string, { total: number; breakdown: Record<string, number> }> = {}
    const userPreds: Record<string, unknown> = {}

    for (const p of (all ?? [])) {
      const k = p.kind
      if (!agg[k]) agg[k] = { total: 0, breakdown: {} }
      agg[k].total++
      const key = typeof p.prediction === 'object'
        ? JSON.stringify(p.prediction)
        : String(p.prediction)
      agg[k].breakdown[key] = (agg[k].breakdown[key] ?? 0) + 1
      if (sessionId && p.session_id === sessionId) userPreds[k] = p.prediction
    }

    return NextResponse.json({
      aggregates: agg,
      userPredictions: userPreds,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
    })
  } catch (err) {
    console.error('predict GET error:', err)
    return NextResponse.json({ aggregates: {}, userPredictions: {} })
  }
}
