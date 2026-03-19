import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-middleware'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json({ passport: {
      checkinCount: 0, sportsCount: 0, eventsCount: 0,
      badges: [], streakDays: 0, favouriteSports: [], favouriteTeams: {},
      recentEvents: [],
    }})
  }

  const supabase = createServiceClient()

  // Fetch passport + checkin history in parallel
  const [passportRes, checkinsRes] = await Promise.all([
    supabase.from('fan_passport').select('*').eq('user_id', user.id).single(),
    supabase.from('checkins').select('match_id, sport_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const passport = passportRes.data ?? {
    checkin_count: 0, sports_count: 0, events_count: 0,
    badges: [], streak_days: 0, favourite_sports: [], favourite_teams: {},
  }

  // Award badges based on activity
  const badges: string[] = [...(passport.badges ?? [])]
  const checkinCount = passport.checkin_count ?? 0
  const sportsCount = passport.sports_count ?? 0

  if (checkinCount >= 1 && !badges.includes('first_checkin')) badges.push('first_checkin')
  if (sportsCount >= 3 && !badges.includes('multi_sport')) badges.push('multi_sport')
  if (checkinCount >= 100 && !badges.includes('century_checkins')) badges.push('century_checkins')
  if ((passport.streak_days ?? 0) >= 7 && !badges.includes('streak_7')) badges.push('streak_7')

  // Update badges if changed
  if (badges.length !== (passport.badges ?? []).length) {
    void supabase.from('fan_passport').upsert({ user_id: user.id, badges })
  }

  return NextResponse.json({
    passport: {
      checkinCount: passport.checkin_count ?? 0,
      sportsCount: passport.sports_count ?? 0,
      eventsCount: passport.events_count ?? 0,
      badges,
      streakDays: passport.streak_days ?? 0,
      favouriteSports: passport.favourite_sports ?? [],
      favouriteTeams: passport.favourite_teams ?? {},
      recentEvents: (checkinsRes.data ?? []).map(c => ({
        label: c.match_id, sport: c.sport_id ?? 'soccer', date: c.created_at,
      })),
    }
  })
}
