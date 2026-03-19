import { createServiceClient } from './supabase-server'
import { SPORTS } from '@/types'
import type { FanGlobeEvent, CityData } from '@/types'

// ── Stadium coordinates ───────────────────────────────────────────────────────
const STADIUMS: Record<string, { lat: number; lng: number; short: string; full: string; camLat: number; camLng: number; camAlt: number }> = {
  azteca:     { lat:19.3029, lng:-99.1504,  short:'Estadio Azteca',       full:'Estadio Azteca, Mexico City',            camLat:19, camLng:-99,   camAlt:2.0 },
  sofi:       { lat:33.9535, lng:-118.3392, short:'SoFi Stadium',         full:'SoFi Stadium, Inglewood CA',             camLat:28, camLng:-110,  camAlt:2.1 },
  metlife:    { lat:40.8135, lng:-74.0745,  short:'MetLife Stadium',      full:'MetLife Stadium, East Rutherford NJ',    camLat:38, camLng:-75,   camAlt:1.8 },
  gillette:   { lat:42.0909, lng:-71.2643,  short:'Gillette Stadium',     full:'Gillette Stadium, Foxborough MA',        camLat:44, camLng:-65,   camAlt:1.9 },
  attdallas:  { lat:32.7480, lng:-97.0931,  short:'AT&T Stadium',         full:'AT&T Stadium, Arlington TX',             camLat:30, camLng:-97,   camAlt:1.9 },
  mercedes:   { lat:33.7554, lng:-84.4009,  short:'Mercedes-Benz Stadium',full:'Mercedes-Benz Stadium, Atlanta GA',      camLat:32, camLng:-84,   camAlt:1.9 },
  levis:      { lat:37.4035, lng:-121.9700, short:"Levi's Stadium",       full:"Levi's Stadium, Santa Clara CA",         camLat:35, camLng:-115,  camAlt:2.0 },
  nrg:        { lat:29.6847, lng:-95.4107,  short:'NRG Stadium',          full:'NRG Stadium, Houston TX',                camLat:27, camLng:-95,   camAlt:1.9 },
  lumen:      { lat:47.5952, lng:-122.3316, short:'Lumen Field',          full:'Lumen Field, Seattle WA',                camLat:45, camLng:-122,  camAlt:1.8 },
  arrowhead:  { lat:39.0489, lng:-94.4839,  short:'Arrowhead Stadium',    full:'GEHA Field at Arrowhead, Kansas City',   camLat:37, camLng:-94,   camAlt:1.9 },
  lincoln:    { lat:39.9008, lng:-75.1675,  short:'Lincoln Financial',    full:'Lincoln Financial Field, Philadelphia',  camLat:40, camLng:-74,   camAlt:1.8 },
  hardrock:   { lat:25.9580, lng:-80.2388,  short:'Hard Rock Stadium',    full:'Hard Rock Stadium, Miami FL',            camLat:24, camLng:-78,   camAlt:1.9 },
  bmo:        { lat:43.6331, lng:-79.4183,  short:'BMO Field',            full:'BMO Field, Toronto',                     camLat:42, camLng:-78,   camAlt:1.8 },
  bcplace:    { lat:49.2767, lng:-123.1116, short:'BC Place',             full:'BC Place, Vancouver',                    camLat:47, camLng:-122,  camAlt:1.8 },
  akron:      { lat:20.6899, lng:-103.4638, short:'Estadio Akron',        full:'Estadio Akron, Guadalajara',             camLat:19, camLng:-100,  camAlt:2.0 },
  bbva:       { lat:25.6697, lng:-100.2420, short:'Estadio BBVA',         full:'Estadio BBVA, Monterrey',                camLat:24, camLng:-100,  camAlt:2.0 },
  monaco:     { lat:43.7347, lng:7.4208,    short:'Circuit de Monaco',    full:'Circuit de Monaco, Monte Carlo',         camLat:46, camLng:10,    camAlt:1.8 },
  nassau:     { lat:40.7128, lng:-74.0059,  short:'Nassau Stadium',       full:'Nassau County International Cricket',    camLat:25, camLng:65,    camAlt:2.4 },
}

function ev(
  id: string, sportId: string,
  home: string, away: string, homeFlag: string, awayFlag: string,
  homeColor: string, awayColor: string,
  stadKey: string, kickoffAt: string,
  isRivalry = false, isFeatured = false
): FanGlobeEvent {
  const s = STADIUMS[stadKey]
  return {
    id, sportId, sport: SPORTS[sportId],
    homeTeam: home, awayTeam: away,
    homeFlag, awayFlag, homeColor, awayColor,
    label: `${home} vs ${away}`,
    venue: s.full, venueShort: s.short,
    stadLat: s.lat, stadLng: s.lng,
    camLat: s.camLat, camLng: s.camLng, camAlt: s.camAlt,
    kickoffAt, status: 'upcoming', isRivalry, isFeatured,
  }
}

// ── World Cup 2026 — All key group stage matches ──────────────────────────────
export const WC2026_EVENTS: FanGlobeEvent[] = [
  // ── OPENING MATCHES ─────────────────────────────────────────────────────────
  ev('wc-opening-mexico','soccer','Mexico','South Africa','🇲🇽','🇿🇦','#006847','#007A4D','azteca','2026-06-11T21:00:00Z',false,true),
  ev('wc-usa-paraguay','soccer','USA','Paraguay','🇺🇸','🇵🇾','#B22234','#D52B1E','sofi','2026-06-13T01:00:00Z',false,true),
  ev('wc-brazil-morocco','soccer','Brazil','Morocco','🇧🇷','🇲🇦','#009C3B','#C1272D','metlife','2026-06-13T22:00:00Z',true,true),
  // ── GROUP A ──────────────────────────────────────────────────────────────────
  ev('wc-a1-mexico-southkorea','soccer','Mexico','South Korea','🇲🇽','🇰🇷','#006847','#003478','akron','2026-06-18T01:00:00Z',false,true),
  ev('wc-a3-mexico-final','soccer','Mexico','UEFA D','🇲🇽','🏳','#006847','#666','azteca','2026-06-24T01:00:00Z',false,false),
  // ── GROUP B ──────────────────────────────────────────────────────────────────
  ev('wc-b1-canada','soccer','Canada','UEFA Playoff A','🇨🇦','🏳','#FF0000','#555','bmo','2026-06-12T19:00:00Z',false,true),
  ev('wc-b2-canada-qatar','soccer','Canada','Qatar','🇨🇦','🇶🇦','#FF0000','#8D1B3D','bcplace','2026-06-18T22:00:00Z',false,true),
  // ── GROUP C ──────────────────────────────────────────────────────────────────
  ev('wc-c1-haiti-scotland','soccer','Haiti','Scotland','🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿','#00209F','#003082','gillette','2026-06-14T01:00:00Z',false,false),
  ev('wc-c2-scotland-morocco','soccer','Scotland','Morocco','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇲🇦','#003082','#C1272D','gillette','2026-06-19T22:00:00Z',false,false),
  ev('wc-c3-scotland-brazil','soccer','Scotland','Brazil','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇧🇷','#003082','#009C3B','hardrock','2026-06-24T22:00:00Z',true,true),
  // ── GROUP D ──────────────────────────────────────────────────────────────────
  ev('wc-d2-usa-australia','soccer','USA','Australia','🇺🇸','🇦🇺','#B22234','#00843D','lumen','2026-06-19T19:00:00Z',false,true),
  ev('wc-d3-usa-final','soccer','USA','UEFA Playoff C','🇺🇸','🏳','#B22234','#555','sofi','2026-06-26T01:00:00Z',false,true),
  // ── GROUP E ──────────────────────────────────────────────────────────────────
  ev('wc-e1-germany-curacao','soccer','Germany','Curaçao','🇩🇪','🇨🇼','#000000','#002B7F','bmo','2026-06-14T21:00:00Z',false,false),
  ev('wc-e2-ecuador-curacao','soccer','Ecuador','Curaçao','🇪🇨','🇨🇼','#FFD100','#002B7F','arrowhead','2026-06-20T00:00:00Z',false,false),
  // ── GROUP F ──────────────────────────────────────────────────────────────────
  ev('wc-f1-netherlands-japan','soccer','Netherlands','Japan','🇳🇱','🇯🇵','#FF6600','#BC002D','lincoln','2026-06-14T19:00:00Z',true,true),
  ev('wc-f2-tunisia-japan','soccer','Tunisia','Japan','🇹🇳','🇯🇵','#E70013','#BC002D','bbva','2026-06-20T04:00:00Z',false,false),
  // ── GROUP G ──────────────────────────────────────────────────────────────────
  ev('wc-g1-belgium-iran','soccer','Belgium','Iran','🇧🇪','🇮🇷','#EF3340','#239F40','levis','2026-06-15T19:00:00Z',false,false),
  // ── GROUP H ──────────────────────────────────────────────────────────────────
  ev('wc-h1-spain-capeverde','soccer','Spain','Cape Verde','🇪🇸','🇨🇻','#AA151B','#003893','mercedes','2026-06-15T17:00:00Z',false,true),
  ev('wc-h2-spain-saudi','soccer','Spain','Saudi Arabia','🇪🇸','🇸🇦','#AA151B','#006C35','mercedes','2026-06-21T17:00:00Z',false,true),
  ev('wc-h3-uruguay-spain','soccer','Uruguay','Spain','🇺🇾','🇪🇸','#75AADB','#AA151B','arrowhead','2026-06-26T01:00:00Z',true,true),
  // ── GROUP I ──────────────────────────────────────────────────────────────────
  ev('wc-i1-france','soccer','France','TBD','🇫🇷','🏳','#002395','#555','lincoln','2026-06-15T22:00:00Z',false,true),
  ev('wc-i2-norway-senegal','soccer','Norway','Senegal','🇳🇴','🇸🇳','#EF2B2D','#00853F','metlife','2026-06-15T01:00:00Z',false,false),
  // ── GROUP J (🔥 DEATH GROUP) ─────────────────────────────────────────────────
  ev('wc-j1-argentina-algeria','soccer','Argentina','Algeria','🇦🇷','🇩🇿','#74ACDF','#006233','arrowhead','2026-06-16T01:00:00Z',false,true),
  ev('wc-j2-argentina-austria','soccer','Argentina','Austria','🇦🇷','🇦🇹','#74ACDF','#ED2939','attdallas','2026-06-22T19:00:00Z',false,true),
  ev('wc-j3-jordan-argentina','soccer','Jordan','Argentina','🇯🇴','🇦🇷','#007A3D','#74ACDF','attdallas','2026-06-27T01:00:00Z',true,true),
  // ── GROUP K ──────────────────────────────────────────────────────────────────
  ev('wc-k1-colombia','soccer','Colombia','Intercontinental W','🇨🇴','🏳','#FCD116','#555','azteca','2026-06-23T02:00:00Z',false,false),
  // ── GROUP L (🔥 ENGLAND GROUP) ───────────────────────────────────────────────
  ev('wc-l1-england-croatia','soccer','England','Croatia','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷','#CF081F','#FF0000','attdallas','2026-06-17T22:00:00Z',true,true),
  ev('wc-l2-england-ghana','soccer','England','Ghana','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭','#CF081F','#006B3F','gillette','2026-06-23T21:00:00Z',false,true),
  ev('wc-l3-panama-england','soccer','Panama','England','🇵🇦','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#DA121A','#CF081F','metlife','2026-06-27T21:00:00Z',false,true),
  // ── SUPER RIVALRY MATCHES ───────────────────────────────────────────────────
  ev('wc-usa-mexico','soccer','USA','Mexico','🇺🇸','🇲🇽','#B22234','#006847','metlife','2026-07-04T21:00:00Z',true,true), // hypothetical KO
  ev('wc-brazil-argentina','soccer','Brazil','Argentina','🇧🇷','🇦🇷','#009C3B','#74ACDF','sofi','2026-07-10T22:00:00Z',true,true),
  ev('wc-final','soccer','TBD','TBD','🏆','🏆','#FFD700','#C0C0C0','metlife','2026-07-19T20:00:00Z',false,true),
  // ── OTHER SPORTS ────────────────────────────────────────────────────────────
  ev('cricket-india-pakistan','cricket','India','Pakistan','🇮🇳','🇵🇰','#FF9933','#01411C','nassau','2026-06-10T14:00:00Z',true,true),
  ev('f1-monaco-2026','f1','Monaco GP','Round 8','🏎️','🏁','#FF0000','#00D2BE','monaco','2026-05-24T13:00:00Z',false,true),
]

export function getFallbackEvents(limit = 16): FanGlobeEvent[] {
  const TODAY_TS = new Date('2026-03-19T00:00:00Z').getTime()
  const all = [...UPCOMING_SPORTS_EVENTS, ...WC2026_EVENTS]
    .filter(e => new Date(e.kickoffAt).getTime() >= TODAY_TS && e.isFeatured)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  return all.slice(0, limit)
}

export async function getLiveEvents(limit = 20): Promise<FanGlobeEvent[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('events').select('*')
      .in('status', ['live', 'upcoming'])
      .order('is_featured', { ascending: false })
      .order('kickoff_at', { ascending: true })
      .limit(limit)
    if (error || !data || data.length === 0) throw new Error('No DB events')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id, sportId: row.sport_id, sport: SPORTS[row.sport_id],
      homeTeam: row.home_team, awayTeam: row.away_team,
      homeFlag: row.home_flag ?? '', awayFlag: row.away_flag ?? '',
      homeColor: row.home_color, awayColor: row.away_color,
      label: row.label ?? `${row.home_team} vs ${row.away_team}`,
      venue: row.venue, venueShort: row.venue_short,
      stadLat: row.stad_lat, stadLng: row.stad_lng,
      camLat: row.cam_lat ?? 20, camLng: row.cam_lng ?? 0, camAlt: row.cam_alt ?? 2.2,
      kickoffAt: row.kickoff_at, status: row.status,
      isRivalry: row.is_rivalry ?? false, isFeatured: row.is_featured ?? false,
    }))
  } catch {
    return getFallbackEvents(limit)
  }
}

// Seed cities per event
export const EVENT_SEED_CITIES: Record<string, CityData[]> = {
  'wc-usa-mexico': [
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:48210,country:'USA'},
    {city:'Mexico City',flag:'🇲🇽',lat:19.43,lng:-99.13,count:42300,country:'Mexico'},
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:31450,country:'USA'},
    {city:'Chicago',flag:'🇺🇸',lat:41.88,lng:-87.63,count:21300,country:'USA'},
    {city:'Guadalajara',flag:'🇲🇽',lat:20.66,lng:-103.35,count:19200,country:'Mexico'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:17800,country:'Canada'},
    {city:'Houston',flag:'🇺🇸',lat:29.76,lng:-95.37,count:16700,country:'USA'},
    {city:'Miami',flag:'🇺🇸',lat:25.77,lng:-80.19,count:14200,country:'USA'},
    {city:'Monterrey',flag:'🇲🇽',lat:25.67,lng:-100.31,count:12800,country:'Mexico'},
    {city:'Montréal',flag:'🇨🇦',lat:45.50,lng:-73.57,count:13400,country:'Canada'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:9400,country:'England'},
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:12900,country:'Brazil'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:7800,country:'Japan'},
    {city:'Lagos',flag:'🇳🇬',lat:6.52,lng:3.38,count:6400,country:'Nigeria'},
    {city:'Mumbai',flag:'🇮🇳',lat:19.08,lng:72.88,count:8200,country:'India'},
    {city:'Seoul',flag:'🇰🇷',lat:37.57,lng:126.98,count:7200,country:'S.Korea'},
  ],
  'wc-brazil-argentina': [
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:64200,country:'Brazil'},
    {city:'Buenos Aires',flag:'🇦🇷',lat:-34.60,lng:-58.38,count:58700,country:'Argentina'},
    {city:'Rio de Janeiro',flag:'🇧🇷',lat:-22.90,lng:-43.17,count:51300,country:'Brazil'},
    {city:'Córdoba',flag:'🇦🇷',lat:-31.42,lng:-64.18,count:19800,country:'Argentina'},
    {city:'Belo Horizonte',flag:'🇧🇷',lat:-19.92,lng:-43.94,count:18900,country:'Brazil'},
    {city:'Rosario',flag:'🇦🇷',lat:-32.95,lng:-60.64,count:14200,country:'Argentina'},
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:22400,country:'USA'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:18700,country:'USA'},
    {city:'Miami',flag:'🇺🇸',lat:25.77,lng:-80.19,count:16900,country:'USA'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:14200,country:'England'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:12800,country:'Spain'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:9800,country:'Japan'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:11200,country:'France'},
    {city:'Melbourne',flag:'🇦🇺',lat:-37.81,lng:144.96,count:7400,country:'Australia'},
    {city:'Lagos',flag:'🇳🇬',lat:6.52,lng:3.38,count:8100,country:'Nigeria'},
    {city:'Johannesburg',flag:'🇿🇦',lat:-26.20,lng:28.04,count:7900,country:'S.Africa'},
  ],
  'wc-brazil-morocco': [
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:52000,country:'Brazil'},
    {city:'Rio de Janeiro',flag:'🇧🇷',lat:-22.90,lng:-43.17,count:43000,country:'Brazil'},
    {city:'Casablanca',flag:'🇲🇦',lat:33.59,lng:-7.62,count:38000,country:'Morocco'},
    {city:'Rabat',flag:'🇲🇦',lat:34.02,lng:-6.83,count:22000,country:'Morocco'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:19000,country:'USA'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:18000,country:'France'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:14000,country:'England'},
    {city:'Buenos Aires',flag:'🇦🇷',lat:-34.60,lng:-58.38,count:13000,country:'Argentina'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:11000,country:'Spain'},
    {city:'Lagos',flag:'🇳🇬',lat:6.52,lng:3.38,count:10000,country:'Nigeria'},
  ],
  'wc-usa-paraguay': [
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:42000,country:'USA'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:38000,country:'USA'},
    {city:'Chicago',flag:'🇺🇸',lat:41.88,lng:-87.63,count:24000,country:'USA'},
    {city:'Houston',flag:'🇺🇸',lat:29.76,lng:-95.37,count:18000,country:'USA'},
    {city:'Asunción',flag:'🇵🇾',lat:-25.28,lng:-57.64,count:14000,country:'Paraguay'},
    {city:'Miami',flag:'🇺🇸',lat:25.77,lng:-80.19,count:13000,country:'USA'},
    {city:'Seattle',flag:'🇺🇸',lat:47.61,lng:-122.33,count:11000,country:'USA'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:9000,country:'Canada'},
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:8000,country:'Brazil'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:7000,country:'England'},
  ],
  'wc-j1-argentina-algeria': [
    {city:'Buenos Aires',flag:'🇦🇷',lat:-34.60,lng:-58.38,count:62000,country:'Argentina'},
    {city:'Córdoba',flag:'🇦🇷',lat:-31.42,lng:-64.18,count:22000,country:'Argentina'},
    {city:'Algiers',flag:'🇩🇿',lat:36.74,lng:3.06,count:48000,country:'Algeria'},
    {city:'Oran',flag:'🇩🇿',lat:35.70,lng:-0.63,count:18000,country:'Algeria'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:24000,country:'France'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:16000,country:'Spain'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:14000,country:'USA'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:12000,country:'England'},
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:11000,country:'Brazil'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:9000,country:'UAE'},
  ],
  'wc-l1-england-croatia': [
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:82000,country:'England'},
    {city:'Manchester',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:53.48,lng:-2.24,count:34000,country:'England'},
    {city:'Birmingham',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:52.48,lng:-1.90,count:24000,country:'England'},
    {city:'Zagreb',flag:'🇭🇷',lat:45.81,lng:15.98,count:38000,country:'Croatia'},
    {city:'Split',flag:'🇭🇷',lat:43.51,lng:16.44,count:18000,country:'Croatia'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:14000,country:'USA'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:9000,country:'Australia'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:8000,country:'Canada'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:7000,country:'UAE'},
    {city:'Berlin',flag:'🇩🇪',lat:52.52,lng:13.41,count:6000,country:'Germany'},
  ],
  'wc-h3-uruguay-spain': [
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:68000,country:'Spain'},
    {city:'Barcelona',flag:'🇪🇸',lat:41.39,lng:2.15,count:44000,country:'Spain'},
    {city:'Montevideo',flag:'🇺🇾',lat:-34.90,lng:-56.19,count:34000,country:'Uruguay'},
    {city:'Seville',flag:'🇪🇸',lat:37.39,lng:-5.99,count:22000,country:'Spain'},
    {city:'Salto',flag:'🇺🇾',lat:-31.39,lng:-57.96,count:12000,country:'Uruguay'},
    {city:'Buenos Aires',flag:'🇦🇷',lat:-34.60,lng:-58.38,count:18000,country:'Argentina'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:14000,country:'USA'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:12000,country:'England'},
    {city:'Miami',flag:'🇺🇸',lat:25.77,lng:-80.19,count:11000,country:'USA'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:10000,country:'France'},
  ],
  'wc-d2-usa-australia': [
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:38000,country:'USA'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:32000,country:'USA'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:42000,country:'Australia'},
    {city:'Melbourne',flag:'🇦🇺',lat:-37.81,lng:144.96,count:36000,country:'Australia'},
    {city:'Seattle',flag:'🇺🇸',lat:47.61,lng:-122.33,count:22000,country:'USA'},
    {city:'Chicago',flag:'🇺🇸',lat:41.88,lng:-87.63,count:18000,country:'USA'},
    {city:'Brisbane',flag:'🇦🇺',lat:-27.47,lng:153.02,count:16000,country:'Australia'},
    {city:'Perth',flag:'🇦🇺',lat:-31.95,lng:115.86,count:12000,country:'Australia'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:9000,country:'Canada'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:8000,country:'England'},
  ],
  'wc-f1-netherlands-japan': [
    {city:'Amsterdam',flag:'🇳🇱',lat:52.37,lng:4.90,count:52000,country:'Netherlands'},
    {city:'Rotterdam',flag:'🇳🇱',lat:51.93,lng:4.47,count:24000,country:'Netherlands'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:62000,country:'Japan'},
    {city:'Osaka',flag:'🇯🇵',lat:34.69,lng:135.50,count:32000,country:'Japan'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:14000,country:'USA'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:12000,country:'England'},
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:11000,country:'USA'},
    {city:'Seoul',flag:'🇰🇷',lat:37.57,lng:126.98,count:10000,country:'S.Korea'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:9000,country:'France'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:8000,country:'Australia'},
  ],
  'cricket-india-pakistan': [
    {city:'Mumbai',flag:'🇮🇳',lat:19.08,lng:72.88,count:142000,country:'India'},
    {city:'Delhi',flag:'🇮🇳',lat:28.61,lng:77.21,count:128000,country:'India'},
    {city:'Karachi',flag:'🇵🇰',lat:24.86,lng:67.01,count:98000,country:'Pakistan'},
    {city:'Bangalore',flag:'🇮🇳',lat:12.97,lng:77.59,count:89000,country:'India'},
    {city:'Lahore',flag:'🇵🇰',lat:31.55,lng:74.35,count:84000,country:'Pakistan'},
    {city:'Chennai',flag:'🇮🇳',lat:13.08,lng:80.27,count:72000,country:'India'},
    {city:'Islamabad',flag:'🇵🇰',lat:33.72,lng:73.07,count:48000,country:'Pakistan'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:38000,country:'England'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:22000,country:'USA'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:16000,country:'UAE'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:18000,country:'Australia'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:14000,country:'Canada'},
  ],
  'f1-monaco-2026': [
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:28000,country:'England'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:24000,country:'France'},
    {city:'Amsterdam',flag:'🇳🇱',lat:52.37,lng:4.90,count:18000,country:'Netherlands'},
    {city:'Milan',flag:'🇮🇹',lat:45.46,lng:9.19,count:22000,country:'Italy'},
    {city:'Munich',flag:'🇩🇪',lat:48.14,lng:11.58,count:18000,country:'Germany'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:16000,country:'Spain'},
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:12000,country:'USA'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:14000,country:'Japan'},
    {city:'Singapore',flag:'🇸🇬',lat:1.35,lng:103.82,count:12000,country:'Singapore'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:8000,country:'UAE'},
  ],
  'wc-final': [
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:82000,country:'USA'},
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:64000,country:'USA'},
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:58000,country:'Brazil'},
    {city:'Buenos Aires',flag:'🇦🇷',lat:-34.60,lng:-58.38,count:52000,country:'Argentina'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:48000,country:'England'},
    {city:'Mexico City',flag:'🇲🇽',lat:19.43,lng:-99.13,count:44000,country:'Mexico'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:38000,country:'France'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:34000,country:'Spain'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:28000,country:'Japan'},
    {city:'Lagos',flag:'🇳🇬',lat:6.52,lng:3.38,count:24000,country:'Nigeria'},
    {city:'Mumbai',flag:'🇮🇳',lat:19.08,lng:72.88,count:22000,country:'India'},
    {city:'Seoul',flag:'🇰🇷',lat:37.57,lng:126.98,count:20000,country:'S.Korea'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:18000,country:'UAE'},
    {city:'Casablanca',flag:'🇲🇦',lat:33.59,lng:-7.62,count:16000,country:'Morocco'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:14000,country:'Australia'},
    {city:'Johannesburg',flag:'🇿🇦',lat:-26.20,lng:28.04,count:12000,country:'S.Africa'},
  ],
}

// Build a default seed for events without explicit data
function defaultSeed(event: FanGlobeEvent): CityData[] {
  const baseData: CityData[] = [
    {city:'New York',flag:'🇺🇸',lat:40.71,lng:-74.00,count:12000,country:'USA'},
    {city:'Los Angeles',flag:'🇺🇸',lat:34.05,lng:-118.24,count:9000,country:'USA'},
    {city:'London',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',lat:51.51,lng:-0.13,count:8000,country:'England'},
    {city:'São Paulo',flag:'🇧🇷',lat:-23.55,lng:-46.63,count:7000,country:'Brazil'},
    {city:'Tokyo',flag:'🇯🇵',lat:35.69,lng:139.69,count:6000,country:'Japan'},
    {city:'Madrid',flag:'🇪🇸',lat:40.42,lng:-3.70,count:5000,country:'Spain'},
    {city:'Paris',flag:'🇫🇷',lat:48.85,lng:2.35,count:5000,country:'France'},
    {city:'Toronto',flag:'🇨🇦',lat:43.65,lng:-79.38,count:4000,country:'Canada'},
    {city:'Sydney',flag:'🇦🇺',lat:-33.87,lng:151.21,count:4000,country:'Australia'},
    {city:'Dubai',flag:'🇦🇪',lat:25.20,lng:55.27,count:3500,country:'UAE'},
  ]
  // Boost home country cities if we can find them
  return baseData
}

export function getEventSeedCities(eventId: string): CityData[] {
  const explicit = EVENT_SEED_CITIES[eventId]
  if (explicit) return explicit
  const event = WC2026_EVENTS.find(e => e.id === eventId)
  if (event) return defaultSeed(event)
  return []
}

export function getEvent(id: string): FanGlobeEvent | undefined {
  return WC2026_EVENTS.find(e => e.id === id)
}

export const MATCH_CONTEXT: Record<string, string> = {
  'wc-usa-mexico': 'USA vs Mexico — CONCACAF rivalry, MetLife Stadium NJ, massive North American derby, World Cup knockout stage',
  'wc-brazil-argentina': 'Brazil vs Argentina — The Superclásico de las Américas, greatest South American rivalry, World Cup knockout',
  'wc-brazil-morocco': 'Brazil vs Morocco — Seleção opens World Cup vs African champions, MetLife Stadium NY, global spectacle',
  'wc-usa-paraguay': 'USA vs Paraguay — United States opens World Cup 2026 on home soil, SoFi Stadium LA',
  'wc-j1-argentina-algeria': 'Argentina vs Algeria — World Cup holders Argentina vs giant-killers Algeria, tense group stage',
  'wc-l1-england-croatia': 'England vs Croatia — Euro 2021 final rematch, England desperate for revenge, Dallas Texas',
  'wc-h3-uruguay-spain': 'Uruguay vs Spain — South American steel vs European tiki-taka, massive tactical battle',
  'wc-d2-usa-australia': 'USA vs Australia — Two football-growing nations clash, Seattle Lumen Field, huge for both nations',
  'wc-f1-netherlands-japan': 'Netherlands vs Japan — European powerhouse vs Asian surprise package, must-watch group match',
  'wc-final': 'FIFA World Cup 2026 Final — The biggest match on Earth, MetLife Stadium NJ, July 19 2026',
  'cricket-india-pakistan': 'India vs Pakistan — Most watched cricket match on Earth, 1.4 billion vs 220 million, pure drama',
  'f1-monaco-2026': 'Monaco Grand Prix 2026 — Most glamorous race on earth, street circuit, F1\'s crown jewel',
}

// ── Upcoming non-WC sports events (from March 19, 2026) ─────────────────────
export const UPCOMING_SPORTS_EVENTS: FanGlobeEvent[] = [
  // ── F1 2026 ───────────────────────────────────────────────────────────────
  ev('f1-japan-2026','f1','Japanese GP','Round 4','🏎️','🏁','#FF1801','#00D2BE',
    'monaco','2026-04-05T05:00:00Z',false,true),
  ev('f1-bahrain-2026','f1','Bahrain GP','Round 5','🏎️','🏁','#FF1801','#00D2BE',
    'monaco','2026-04-19T15:00:00Z',false,false),
  ev('f1-miami-2026','f1','Miami GP','Round 7','🏎️','🏁','#FF1801','#00D2BE',
    'hardrock','2026-05-10T19:00:00Z',false,true),
  ev('f1-monaco-2026','f1','Monaco GP','Round 8','🏎️','🏁','#FF1801','#00D2BE',
    'monaco','2026-05-24T13:00:00Z',false,true),
  // ── IPL 2026 ──────────────────────────────────────────────────────────────
  ev('ipl-rcb-mi','cricket','Royal Challengers','Mumbai Indians','🏏','🏏','#D11D1D','#004BA0',
    'nassau','2026-03-28T14:00:00Z',true,true),
  ev('ipl-csk-kkr','cricket','Chennai Super Kings','Kolkata Knight Riders','🏏','🏏','#FFFF00','#522D80',
    'nassau','2026-04-04T14:00:00Z',true,true),
  ev('ipl-final-2026','cricket','IPL Final 2026','TBD','🏏','🏆','#FF6B00','#FFD700',
    'nassau','2026-05-25T14:00:00Z',false,true),
  // ── NBA Playoffs 2026 ─────────────────────────────────────────────────────
  ev('nba-playoffs-2026','nba','NBA Playoffs','2026','🏀','🏆','#EA580C','#000',
    'sofi','2026-04-18T23:00:00Z',false,true),
  ev('nba-finals-2026','nba','NBA Finals','Game 1','🏀','🏆','#EA580C','#000',
    'sofi','2026-06-05T23:00:00Z',false,true),
  // ── Champions League ──────────────────────────────────────────────────────
  ev('ucl-qf-leg1','soccer','Champions League','Quarter Finals','⚽','🏆','#001D6E','#FFD700',
    'metlife','2026-04-07T19:00:00Z',false,true),
  ev('ucl-sf-leg1','soccer','Champions League','Semi Finals','⚽','🏆','#001D6E','#FFD700',
    'metlife','2026-04-28T19:00:00Z',false,true),
  ev('ucl-final-2026','soccer','Champions League','Final - München','⚽','🏆','#001D6E','#FFD700',
    'attdallas','2026-05-30T19:00:00Z',false,true),
  // ── Wimbledon 2026 ────────────────────────────────────────────────────────
  ev('wimbledon-2026','f1','Wimbledon','2026','🎾','🏆','#006400','#F0F0F0',
    'monaco','2026-06-29T11:00:00Z',false,true),
]

// Today's date for filtering
const TODAY = new Date('2026-03-19T00:00:00Z')

export function getUpcomingEvents(sportId?: string, limit = 40): FanGlobeEvent[] {
  const all = [...UPCOMING_SPORTS_EVENTS, ...WC2026_EVENTS]
    .filter(e => new Date(e.kickoffAt) >= TODAY)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())

  if (sportId) return all.filter(e => e.sportId === sportId).slice(0, limit)
  return all.slice(0, limit)
}

export function getUpcomingFeatured(limit = 16): FanGlobeEvent[] {
  return getUpcomingEvents().filter(e => e.isFeatured).slice(0, limit)
}

export function getEventsBySport(): Record<string, FanGlobeEvent[]> {
  const all = getUpcomingEvents()
  return all.reduce((acc, e) => {
    if (!acc[e.sportId]) acc[e.sportId] = []
    acc[e.sportId].push(e)
    return acc
  }, {} as Record<string, FanGlobeEvent[]>)
}
