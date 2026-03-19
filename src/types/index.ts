export interface Sport {
  id: string; name: string; emoji: string
  arcColor: string; atmosphereColor: string
  vibes: SportVibe[]; rivalryEnabled: boolean
}
export interface SportVibe { key: string; emoji: string; label: string }
export interface FanGlobeEvent {
  id: string; sportId: string; sport?: Sport
  homeTeam: string; awayTeam: string
  homeFlag: string; awayFlag: string
  homeColor?: string; awayColor?: string
  label: string; venue: string; venueShort: string
  stadLat: number; stadLng: number
  camLat: number; camLng: number; camAlt: number
  kickoffAt: string; status: 'upcoming'|'live'|'finished'
  isRivalry: boolean; isFeatured: boolean
}
export interface Vibe { key: string; emoji: string; label: string }
export interface Pulse { fire: number; ecstatic: number; nervous: number; crushed: number; moment: number; [key: string]: number }
export interface CityData { city: string; flag: string; lat: number; lng: number; count: number; country: string; homeCount?: number; awayCount?: number }
export interface Snapshot { eventId: string; sportId: string; totalCount: number; homeCount: number; awayCount: number; cities: CityData[]; pulse: Pulse; countryCount: number; updatedAt: string }
export interface Cheer { id: string; eventId: string; sportId: string; city: string; country: string; flag: string; text: string; vibe: string; source: 'ai'|'user'; displayName?: string; createdAt: string }
export interface Moment { id: string; eventId: string; sportId: string; type: string; label: string; minute?: number; reactionCount: number; cardImageUrl?: string; createdAt: string }
export interface FanPassport { userId: string; favouriteSports: string[]; favouriteTeams: Record<string,string>; checkinCount: number; sportsCount: number; eventsCount: number; badges: string[]; streakDays: number; lastCheckinAt?: string }
export interface UserProfile { id: string; display_name: string|null; favourite_team: string|null; country: string|null; country_flag: string|null; email: string|null; email_updates: boolean; avatar_seed: string|null; is_anonymous: boolean; created_at: string; updated_at: string }
export interface WatchParty { id: string; venueName: string; address?: string; city: string; country?: string; lat: number; lng: number; sportIds: string[]; website?: string; checkinCount: number; isFeatured: boolean; verified: boolean }

export const SPORTS: Record<string, Sport> = {
  soccer:  { id:'soccer',  name:'Football',  emoji:'⚽',  arcColor:'rgba(57,255,118,',  atmosphereColor:'rgba(57,255,118,0.65)', rivalryEnabled:true,  vibes:[{key:'fire',emoji:'🔥',label:'Pumped'},{key:'ecstatic',emoji:'🎉',label:'Ecstatic'},{key:'nervous',emoji:'😰',label:'Nervous'},{key:'crushed',emoji:'💀',label:'Gutted'},{key:'moment',emoji:'⚽',label:'GOAL!!'}] },
  cricket: { id:'cricket', name:'Cricket',   emoji:'🏏',  arcColor:'rgba(0,180,255,',   atmosphereColor:'rgba(0,180,255,0.6)',  rivalryEnabled:true,  vibes:[{key:'fire',emoji:'🏏',label:'Six!'},{key:'ecstatic',emoji:'🎉',label:'Century!'},{key:'nervous',emoji:'😰',label:'Nervous 90s'},{key:'crushed',emoji:'💀',label:'Wicket!!'},{key:'moment',emoji:'🎯',label:'OUT!!'}] },
  f1:      { id:'f1',      name:'Formula 1', emoji:'🏎️', arcColor:'rgba(220,38,38,',   atmosphereColor:'rgba(220,38,38,0.6)',  rivalryEnabled:false, vibes:[{key:'fire',emoji:'🏎️',label:'DRS!'},{key:'ecstatic',emoji:'🏆',label:'Win!!'},{key:'nervous',emoji:'😰',label:'Safety car'},{key:'crushed',emoji:'💀',label:'Retired'},{key:'moment',emoji:'🚀',label:'Fastest lap!'}] },
  nfl:     { id:'nfl',     name:'NFL',        emoji:'🏈',  arcColor:'rgba(124,58,237,',  atmosphereColor:'rgba(124,58,237,0.6)', rivalryEnabled:true,  vibes:[{key:'fire',emoji:'🏈',label:'TD!!'},{key:'ecstatic',emoji:'🎉',label:'Playoff!'},{key:'nervous',emoji:'😰',label:'4th down'},{key:'crushed',emoji:'💀',label:'Interception'},{key:'moment',emoji:'💥',label:'SACK!'}] },
  nba:     { id:'nba',     name:'NBA',         emoji:'🏀',  arcColor:'rgba(234,88,12,',   atmosphereColor:'rgba(234,88,12,0.6)',  rivalryEnabled:true,  vibes:[{key:'fire',emoji:'🏀',label:'And-1!'},{key:'ecstatic',emoji:'🎉',label:'Poster!'},{key:'nervous',emoji:'😰',label:'Clutch time'},{key:'crushed',emoji:'💀',label:'Brick'},{key:'moment',emoji:'💥',label:'DUNK!!'}] },
}
export const SPORT_LIST = Object.values(SPORTS)
export function getSport(id: string) { return SPORTS[id] }
export const BADGES: Record<string,{label:string;emoji:string;desc:string}> = {
  'first_checkin':     {label:'First Pin',       emoji:'📍', desc:'Dropped your first pin'},
  'globetrotter':      {label:'Globetrotter',    emoji:'🌍', desc:'Checked in from 3+ countries'},
  'multi_sport':       {label:'All-Rounder',     emoji:'🏆', desc:'Checked into 3+ sports'},
  'rivalry_survivor':  {label:'Rival',           emoji:'⚔️', desc:'Checked into a rivalry match'},
  'streak_7':          {label:'7-Day Streak',    emoji:'🔥', desc:'7 consecutive days checking in'},
  'world_cup_watcher': {label:'World Cup Fan',   emoji:'⚽', desc:'Checked into World Cup 2026'},
  'cricket_fanatic':   {label:'Cricket Fanatic', emoji:'🏏', desc:'Checked into India vs Pakistan'},
  'century_checkins':  {label:'Century!',        emoji:'💯', desc:'100 total check-ins'},
}
export const POPULAR_TEAMS = [
  {name:'USA',flag:'🇺🇸'},{name:'Mexico',flag:'🇲🇽'},{name:'Brazil',flag:'🇧🇷'},
  {name:'Argentina',flag:'🇦🇷'},{name:'England',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},{name:'Spain',flag:'🇪🇸'},
  {name:'Germany',flag:'🇩🇪'},{name:'France',flag:'🇫🇷'},{name:'Portugal',flag:'🇵🇹'},
  {name:'India',flag:'🇮🇳'},{name:'Pakistan',flag:'🇵🇰'},{name:'Australia',flag:'🇦🇺'},
  {name:'Netherlands',flag:'🇳🇱'},{name:'Morocco',flag:'🇲🇦'},{name:'Japan',flag:'🇯🇵'},
  {name:'S.Korea',flag:'🇰🇷'},{name:'Nigeria',flag:'🇳🇬'},{name:'Canada',flag:'🇨🇦'},
]
