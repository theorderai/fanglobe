import { Redis } from '@upstash/redis'
import type { Pulse, CityData } from '@/types'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const keys = {
  total:      (eid: string) => `fg:event:${eid}:total`,
  homeTotal:  (eid: string) => `fg:event:${eid}:home`,
  awayTotal:  (eid: string) => `fg:event:${eid}:away`,
  city:       (eid: string) => `fg:event:${eid}:cities`,
  pulse:      (eid: string) => `fg:event:${eid}:pulse`,
  snap:       (eid: string) => `fg:event:${eid}:snapshot`,
  rate:       (id: string, ep: string) => `fg:rate:${ep}:${id}`,
  sportTotal: (sid: string) => `fg:sport:${sid}:total`,
  moment:     (mid: string) => `fg:moment:${mid}:reactions`,
}

export async function incrCheckin(eid: string, city?: string, teamSide?: 'home'|'away', sportId?: string): Promise<number> {
  const p = redis.pipeline()
  p.incr(keys.total(eid))
  if (city) p.hincrby(keys.city(eid), city, 1)
  if (teamSide === 'home') p.incr(keys.homeTotal(eid))
  if (teamSide === 'away') p.incr(keys.awayTotal(eid))
  if (sportId) p.incr(keys.sportTotal(sportId))
  const r = await p.exec<number[]>()
  return r[0]
}

export async function castPulseVote(eid: string, vibe: string, prev?: string): Promise<void> {
  const p = redis.pipeline()
  if (prev) p.hincrby(keys.pulse(eid), prev, -1)
  p.hincrby(keys.pulse(eid), vibe, 1)
  await p.exec()
}

export async function getEventSnapshot(eid: string) {
  const [total, homeTotal, awayTotal, cities, pulse] = await Promise.all([
    redis.get<number>(keys.total(eid)),
    redis.get<number>(keys.homeTotal(eid)),
    redis.get<number>(keys.awayTotal(eid)),
    redis.hgetall<Record<string,number>>(keys.city(eid)),
    redis.hgetall<Record<string,number>>(keys.pulse(eid)),
  ])
  return {
    total: total ?? 0, homeTotal: homeTotal ?? 0, awayTotal: awayTotal ?? 0,
    cities: cities ?? {},
    pulse: { fire: Number(pulse?.fire??0), ecstatic: Number(pulse?.ecstatic??0), nervous: Number(pulse?.nervous??0), crushed: Number(pulse?.crushed??0), moment: Number(pulse?.moment??0) } satisfies Pulse,
  }
}

export async function getCachedSnapshot(eid: string): Promise<string|null> { return redis.get<string>(keys.snap(eid)) }
export async function setCachedSnapshot(eid: string, data: string): Promise<void> {
  await redis.setex(keys.snap(eid), 300, data)
}

export async function checkRateLimit(id: string, ep: string, limit: number, windowSecs: number): Promise<boolean> {
  const key = keys.rate(id, ep)
  const p = redis.pipeline()
  p.incr(key); p.expire(key, windowSecs)
  const r = await p.exec<[number,number]>()
  return r[0] <= limit
}

export async function seedEventData(eid: string, cities: CityData[], sportId: string): Promise<void> {
  const existing = await redis.get(keys.total(eid))
  if (existing !== null) return
  const p = redis.pipeline()
  let total = 0
  for (const c of cities) { p.hset(keys.city(eid), { [c.city]: c.count }); total += c.count }
  p.set(keys.total(eid), total)
  p.set(keys.sportTotal(sportId), total)
  p.hset(keys.pulse(eid), { fire: Math.floor(total*0.35), ecstatic: Math.floor(total*0.28), nervous: Math.floor(total*0.24), crushed: Math.floor(total*0.10), moment: Math.floor(total*0.03) })
  await p.exec()
}

export async function incrMomentReaction(mid: string): Promise<number> { return redis.incr(keys.moment(mid)) }