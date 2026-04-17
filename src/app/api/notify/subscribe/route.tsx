import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, sessionId, city, country, flag, cityRank, matchId, sportId } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert — don't create duplicates, just update metadata
    const { error } = await supabase
      .from('fan_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        session_id: sessionId,
        city, country, flag,
        city_rank: cityRank,
        match_id: matchId,
        sport_id: sportId ?? 'soccer',
      }, { onConflict: 'email' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('subscribe error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}