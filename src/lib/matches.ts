// Backwards-compat shim — new code should use src/lib/events.ts
export { getFallbackEvents as getMatch, getFallbackEvents, getEventSeedCities as getMatchCities, MATCH_CONTEXT } from './events'
export { type FanGlobeEvent as Match } from '@/types'
