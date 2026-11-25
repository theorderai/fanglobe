import { Redis } from '@upstash/redis'
import type { Side, Tally, Verdict } from '@/types'
import { emptyTally } from './verdict'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/** Width of one tap bucket in the live timeseries. */
export const BUCKET_SEC = 10
const TAP_TTL_SEC = 6 * 3600
const VOTE_TTL_SEC = 60 * 24 * 3600

export const keys = {
  tally:     (incidentId: string) => `fv:inc:${incidentId}:tally`,
  voters:    (incidentId: string) => `fv:inc:${incidentId}:voters`,
  sides:     (matchId: string) => `fv:m:${matchId}:sides`,
  tap:       (matchId: string, bucket: number) => `fv:m:${matchId}:t:${bucket}`,
  tapCool:   (matchId: string, userId: string) => `fv:m:${matchId}:tapcool:${userId}`,
  spikeLock: (matchId: string) => `fv:m:${matchId}:spikelock`,
  rate:      (id: string, ep: string) => `fv:rate:${ep}:${id}`,
  cronLock:  (name: string) => `fv:cron:${name}`,
}

export function bucketOf(ms = Date.now()): number {
  return Math.floor(ms / 1000 / BUCKET_SEC)
}

// ── Sides ──────────────────────────────────────────────────────────────────

export async function setSide(matchId: string, userId: string, side: Side) {
  await redis.hset(keys.sides(matchId), { [userId]: side })
}

export async function getSide(matchId: string, userId: string): Promise<Side | null> {
  const v = await redis.hget<string>(keys.sides(matchId), userId)
  return v === 'home' || v === 'away' || v === 'neutral' ? v : null
}

// ── Votes ──────────────────────────────────────────────────────────────────

/**
 * Record a vote. Returns false if this user already voted on the incident.
 * The voters set makes the vote count exactly-once even under retries.
 */
export async function recordVote(
  incidentId: string, userId: string, side: Side, verdict: Verdict, anger: number,
): Promise<boolean> {
  const added = await redis.sadd(keys.voters(incidentId), userId)
  if (added === 0) return false
  const p = redis.pipeline()
  p.hincrby(keys.tally(incidentId), `${side}:${verdict}`, 1)
  p.hincrby(keys.tally(incidentId), `${side}:anger`, anger)
  p.expire(keys.tally(incidentId), VOTE_TTL_SEC)
  p.expire(keys.voters(incidentId), VOTE_TTL_SEC)
  await p.exec()
  return true
}

function parseTally(raw: Record<string, unknown> | null): Tally {
  const t = emptyTally()
  if (!raw) return t
  for (const side of ['home', 'away', 'neutral'] as const) {
    t[side].right = Number(raw[`${side}:right`] ?? 0)
    t[side].wrong = Number(raw[`${side}:wrong`] ?? 0)
    t[side].angerSum = Number(raw[`${side}:anger`] ?? 0)
  }
  return t
}

export async function getTallies(incidentIds: string[]): Promise<Map<string, Tally | null>> {
  const out = new Map<string, Tally | null>()
  if (!incidentIds.length) return out
  const p = redis.pipeline()
  for (const id of incidentIds) p.hgetall(keys.tally(id))
  const rows = await p.exec<(Record<string, unknown> | null)[]>()
  incidentIds.forEach((id, i) => out.set(id, rows[i] ? parseTally(rows[i]) : null))
  return out
}

/** Write a tally rebuilt from Postgres back into Redis (cold-cache path). */
export async function primeTally(incidentId: string, tally: Tally) {
  const fields: Record<string, number> = {}
  for (const side of ['home', 'away', 'neutral'] as const) {
    fields[`${side}:right`] = tally[side].right
    fields[`${side}:wrong`] = tally[side].wrong
    fields[`${side}:anger`] = tally[side].angerSum
  }
  const p = redis.pipeline()
  p.hset(keys.tally(incidentId), fields)
  p.expire(keys.tally(incidentId), VOTE_TTL_SEC)
  await p.exec()
}

// ── Tap timeseries ─────────────────────────────────────────────────────────

/** Count a "bad call!" tap. Returns false if the user is still on cooldown. */
export async function recordTap(matchId: string, userId: string, cooldownSec = 5): Promise<boolean> {
  const ok = await redis.set(keys.tapCool(matchId, userId), 1, { nx: true, ex: cooldownSec })
  if (ok !== 'OK') return false
  const key = keys.tap(matchId, bucketOf())
  const p = redis.pipeline()
  p.incr(key)
  p.expire(key, TAP_TTL_SEC)
  await p.exec()
  return true
}

/** The last `n` buckets for a match, oldest → newest (current bucket last). */
export async function getTapSeries(matchId: string, n: number): Promise<{ startBucket: number; counts: number[] }> {
  const end = bucketOf()
  const startBucket = end - n + 1
  const ks = Array.from({ length: n }, (_, i) => keys.tap(matchId, startBucket + i))
  const vals = await redis.mget<(number | string | null)[]>(...ks)
  return { startBucket, counts: vals.map(v => Number(v ?? 0)) }
}

/** Only one incident per match may auto-open inside this window. */
export async function acquireSpikeLock(matchId: string, windowSec = 90): Promise<boolean> {
  const ok = await redis.set(keys.spikeLock(matchId), 1, { nx: true, ex: windowSec })
  return ok === 'OK'
}

// ── Misc ───────────────────────────────────────────────────────────────────

export async function checkRateLimit(id: string, ep: string, limit: number, windowSecs: number): Promise<boolean> {
  const key = keys.rate(id, ep)
  const p = redis.pipeline()
  p.incr(key)
  p.expire(key, windowSecs)
  const r = await p.exec<[number, number]>()
  return r[0] <= limit
}

/** Returns true if the caller got the lock (i.e. the job should run now). */
export async function cronGate(name: string, everySec: number): Promise<boolean> {
  const ok = await redis.set(keys.cronLock(name), 1, { nx: true, ex: everySec })
  return ok === 'OK'
}
