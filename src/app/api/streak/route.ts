import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    const city = url.searchParams.get('city')

    const supabase = createServiceClient()
    const result: {
      user?: { currentStreak: number; longestStreak: number; matchesWatched: number; countriesWatched: number }
      city?: { name: string; currentStreak: number; longestStreak: number; bestRank: number; lastRank: number }
      achievements?: Array<{ key: string; earnedAt: string }>
    } = {}

    if (sessionId) {
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, matches_watched, countries_watched')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (streak) {
        result.user = {
          currentStreak: streak.current_streak ?? 0,
          longestStreak: streak.longest_streak ?? 0,
          matchesWatched: streak.matches_watched ?? 0,
          countriesWatched: Array.isArray(streak.countries_watched) ? streak.countries_watched.length : 0,
        }
      }

      const { data: badges } = await supabase
        .from('user_achievements')
        .select('badge_key, earned_at')
        .eq('session_id', sessionId)
        .order('earned_at', { ascending: false })

      result.achievements = (badges ?? []).map(b => ({ key: b.badge_key, earnedAt: b.earned_at }))
    }

    if (city) {
      const { data: cityStreak } = await supabase
        .from('city_streaks')
        .select('current_streak, longest_streak, best_rank, last_rank')
        .eq('city', city)
        .maybeSingle()

      if (cityStreak) {
        result.city = {
          name: city,
          currentStreak: cityStreak.current_streak ?? 0,
          longestStreak: cityStreak.longest_streak ?? 0,
          bestRank: cityStreak.best_rank ?? 0,
          lastRank: cityStreak.last_rank ?? 0,
        }
      }
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    })
  } catch (err) {
    console.error('streak error:', err)
    return NextResponse.json({})
  }
}
