import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, getRealIp, hashIp } from '@/lib/auth-middleware'
import { incrCheckin, checkRateLimit } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { matchId, lat, lng, teamSide } = body

    if (!matchId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Try to get auth user — but don't require it (graceful degradation)
    const user = await getAuthUser(req)
    const sessionKey = user?.id ?? `anon_${await hashIp(getRealIp(req))}`

    // Rate limit — 1 checkin per session per match per hour
    const [sessionAllowed, ipAllowed] = await Promise.all([
      checkRateLimit(`sess:${sessionKey}:${matchId}`, 'checkin', 1, 3600),
      checkRateLimit(`ip:${await hashIp(getRealIp(req))}`, 'checkin', 5, 3600),
    ])

    if (!sessionAllowed) {
      return NextResponse.json({ error: 'Already checked in for this match' }, { status: 429 })
    }
    if (!ipAllowed) {
      return NextResponse.json({ error: 'Too many checkins' }, { status: 429 })
    }

    const city = geoToCity(lat, lng)
    const newTotal = await incrCheckin(
      matchId, city?.name,
      teamSide as 'home' | 'away' | undefined,
      undefined
    )

    // Persist async (non-blocking)
    if (user) {
      const supabase = createServiceClient()
      void supabase.from('checkins').insert({
        match_id: matchId, event_id: matchId,
        lat: Math.round(lat * 100) / 100,
        lng: Math.round(lng * 100) / 100,
        country: city?.country ?? null,
        city: city?.name ?? null,
        session_id: user.id, user_id: user.id,
        team_side: teamSide ?? null,
      })
    }

    return NextResponse.json({
      success: true,
      total: newTotal,
      city: city?.name,
      country: city?.country,
      flag: city?.flag,
    })
  } catch (err) {
    console.error('Checkin error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function geoToCity(lat: number, lng: number) {
  const cities = [
    { name:'New York',      country:'USA',         flag:'🇺🇸', lat:40.71, lng:-74.00, r:1.5 },
    { name:'Los Angeles',   country:'USA',         flag:'🇺🇸', lat:34.05, lng:-118.24,r:1.5 },
    { name:'Chicago',       country:'USA',         flag:'🇺🇸', lat:41.88, lng:-87.63, r:1.0 },
    { name:'Houston',       country:'USA',         flag:'🇺🇸', lat:29.76, lng:-95.37, r:1.0 },
    { name:'Miami',         country:'USA',         flag:'🇺🇸', lat:25.77, lng:-80.19, r:0.8 },
    { name:'Dallas',        country:'USA',         flag:'🇺🇸', lat:32.78, lng:-96.80, r:0.8 },
    { name:'Seattle',       country:'USA',         flag:'🇺🇸', lat:47.61, lng:-122.33,r:0.8 },
    { name:'Philadelphia',  country:'USA',         flag:'🇺🇸', lat:39.95, lng:-75.16, r:0.7 },
    { name:'Mexico City',   country:'Mexico',      flag:'🇲🇽', lat:19.43, lng:-99.13, r:1.2 },
    { name:'Guadalajara',   country:'Mexico',      flag:'🇲🇽', lat:20.66, lng:-103.35,r:0.8 },
    { name:'Monterrey',     country:'Mexico',      flag:'🇲🇽', lat:25.67, lng:-100.31,r:0.8 },
    { name:'Toronto',       country:'Canada',      flag:'🇨🇦', lat:43.65, lng:-79.38, r:0.8 },
    { name:'Montréal',      country:'Canada',      flag:'🇨🇦', lat:45.50, lng:-73.57, r:0.8 },
    { name:'Vancouver',     country:'Canada',      flag:'🇨🇦', lat:49.28, lng:-123.12,r:0.8 },
    { name:'São Paulo',     country:'Brazil',      flag:'🇧🇷', lat:-23.55,lng:-46.63, r:1.5 },
    { name:'Rio de Janeiro',country:'Brazil',      flag:'🇧🇷', lat:-22.90,lng:-43.17, r:1.2 },
    { name:'Buenos Aires',  country:'Argentina',   flag:'🇦🇷', lat:-34.60,lng:-58.38, r:1.5 },
    { name:'Bogotá',        country:'Colombia',    flag:'🇨🇴', lat:4.71,  lng:-74.07, r:0.8 },
    { name:'Lima',          country:'Peru',        flag:'🇵🇪', lat:-12.05,lng:-77.04, r:0.8 },
    { name:'Santiago',      country:'Chile',       flag:'🇨🇱', lat:-33.46,lng:-70.65, r:0.8 },
    { name:'London',        country:'England',     flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', lat:51.51, lng:-0.13,  r:0.8 },
    { name:'Manchester',    country:'England',     flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', lat:53.48, lng:-2.24,  r:0.7 },
    { name:'Madrid',        country:'Spain',       flag:'🇪🇸', lat:40.42, lng:-3.70,  r:0.8 },
    { name:'Barcelona',     country:'Spain',       flag:'🇪🇸', lat:41.39, lng:2.15,   r:0.8 },
    { name:'Paris',         country:'France',      flag:'🇫🇷', lat:48.85, lng:2.35,   r:0.8 },
    { name:'Berlin',        country:'Germany',     flag:'🇩🇪', lat:52.52, lng:13.41,  r:0.8 },
    { name:'Munich',        country:'Germany',     flag:'🇩🇪', lat:48.14, lng:11.58,  r:0.8 },
    { name:'Rome',          country:'Italy',       flag:'🇮🇹', lat:41.90, lng:12.50,  r:0.8 },
    { name:'Amsterdam',     country:'Netherlands', flag:'🇳🇱', lat:52.37, lng:4.90,   r:0.6 },
    { name:'Lisbon',        country:'Portugal',    flag:'🇵🇹', lat:38.72, lng:-9.14,  r:0.6 },
    { name:'Istanbul',      country:'Turkey',      flag:'🇹🇷', lat:41.01, lng:28.95,  r:0.8 },
    { name:'Warsaw',        country:'Poland',      flag:'🇵🇱', lat:52.23, lng:21.01,  r:0.6 },
    { name:'Dubai',         country:'UAE',         flag:'🇦🇪', lat:25.20, lng:55.27,  r:0.8 },
    { name:'Riyadh',        country:'Saudi Arabia',flag:'🇸🇦', lat:24.69, lng:46.72,  r:0.8 },
    { name:'Mumbai',        country:'India',       flag:'🇮🇳', lat:19.08, lng:72.88,  r:1.0 },
    { name:'Delhi',         country:'India',       flag:'🇮🇳', lat:28.61, lng:77.21,  r:1.0 },
    { name:'Bangalore',     country:'India',       flag:'🇮🇳', lat:12.97, lng:77.59,  r:0.8 },
    { name:'Karachi',       country:'Pakistan',    flag:'🇵🇰', lat:24.86, lng:67.01,  r:0.8 },
    { name:'Lahore',        country:'Pakistan',    flag:'🇵🇰', lat:31.55, lng:74.35,  r:0.8 },
    { name:'Tokyo',         country:'Japan',       flag:'🇯🇵', lat:35.69, lng:139.69, r:1.0 },
    { name:'Seoul',         country:'S.Korea',     flag:'🇰🇷', lat:37.57, lng:126.98, r:0.8 },
    { name:'Beijing',       country:'China',       flag:'🇨🇳', lat:39.91, lng:116.39, r:1.0 },
    { name:'Shanghai',      country:'China',       flag:'🇨🇳', lat:31.23, lng:121.47, r:1.0 },
    { name:'Singapore',     country:'Singapore',   flag:'🇸🇬', lat:1.35,  lng:103.82, r:0.6 },
    { name:'Sydney',        country:'Australia',   flag:'🇦🇺', lat:-33.87,lng:151.21, r:1.0 },
    { name:'Melbourne',     country:'Australia',   flag:'🇦🇺', lat:-37.81,lng:144.96, r:1.0 },
    { name:'Lagos',         country:'Nigeria',     flag:'🇳🇬', lat:6.52,  lng:3.38,   r:0.8 },
    { name:'Nairobi',       country:'Kenya',       flag:'🇰🇪', lat:-1.29, lng:36.82,  r:0.8 },
    { name:'Casablanca',    country:'Morocco',     flag:'🇲🇦', lat:33.59, lng:-7.62,  r:0.8 },
    { name:'Johannesburg',  country:'S.Africa',    flag:'🇿🇦', lat:-26.20,lng:28.04,  r:0.8 },
    { name:'Cairo',         country:'Egypt',       flag:'🇪🇬', lat:30.04, lng:31.24,  r:0.8 },
  ]
  const match = cities
    .map(c => ({ ...c, dist: Math.hypot(lat - c.lat, lng - c.lng) }))
    .filter(c => c.dist < c.r)
    .sort((a, b) => a.dist - b.dist)[0]
  return match ?? null
}
