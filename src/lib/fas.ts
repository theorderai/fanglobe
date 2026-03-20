/**
 * FanGlobe Atmosphere Score (FAS)
 * A 0–100 proprietary metric measuring live global fan energy for a match.
 *
 * Components:
 *   Fan Density    40% — total fans watching relative to expected peak
 *   Emotion Heat   30% — intensity of emotional signal (not neutral)
 *   Geo Spread     20% — how many countries/continents are represented
 *   Cheer Velocity 10% — cheers per minute (proxy for real-time engagement)
 *
 * A score of 94 means: massive global crowd, highly emotional, all continents,
 * fans actively cheering. Think Brazil vs Morocco in the final minute.
 */

export interface FASInputs {
    totalFans: number
    pulse: { fire: number; ecstatic: number; nervous: number; crushed: number; moment: number }
    countryCount: number
    cityCount: number
    cheerCount?: number        // cheers in last 5 minutes
    minutesSinceKickoff?: number
    sportId?: string
  }
  
  export interface FASResult {
    score: number              // 0–100 rounded integer
    label: string              // "Tepid" | "Building" | "Electric" | "Legendary"
    color: string              // hex
    components: {
      density: number          // 0–100
      emotion: number          // 0–100
      spread: number           // 0–100
      velocity: number         // 0–100
    }
  }
  
  // Expected fan peaks per sport (used to normalize density score)
  const SPORT_PEAKS: Record<string, number> = {
    soccer:  2_000_000,
    cricket: 1_500_000,
    f1:      500_000,
    nba:     300_000,
  }
  
  export function computeFAS(inputs: FASInputs): FASResult {
    const {
      totalFans,
      pulse,
      countryCount,
      cityCount,
      cheerCount = 0,
      minutesSinceKickoff = 0,
      sportId = 'soccer',
    } = inputs
  
    // ── 1. Fan Density (40%) ─────────────────────────────────────────────────
    const peak = SPORT_PEAKS[sportId] ?? 1_000_000
    const densityRaw = Math.min(1, totalFans / peak)
    // Logarithmic — so 100K fans still feels significant, not just 0.05
    const density = Math.round(Math.log1p(densityRaw * Math.E) / Math.log1p(Math.E) * 100)
  
    // ── 2. Emotion Heat (30%) ────────────────────────────────────────────────
    // High emotion = any strong feeling (fire, ecstatic, crushed) vs neutral
    const totalVotes = Object.values(pulse).reduce((s, n) => s + n, 0)
    let emotion = 0
    if (totalVotes > 0) {
      const highEmotionVotes = (pulse.fire ?? 0) + (pulse.ecstatic ?? 0) + (pulse.crushed ?? 0) + (pulse.moment ?? 0)
      const nervousVotes = (pulse.nervous ?? 0)
      // Nervous is still engagement — half weight
      const weighted = highEmotionVotes + nervousVotes * 0.5
      const ratio = weighted / totalVotes
      // Scale: pure emotional crowd = 100, all neutral = 0
      // Also boost by vote volume (more votes = more reliable signal)
      const volumeBoost = Math.min(1, totalVotes / 500)
      emotion = Math.round(ratio * 85 + volumeBoost * 15)
    }
  
    // ── 3. Geo Spread (20%) ──────────────────────────────────────────────────
    // Max spread = 50+ countries across all continents
    const countryCap = 60
    const cityCap = 100
    const countryScore = Math.min(100, (countryCount / countryCap) * 100)
    const cityScore = Math.min(100, (cityCount / cityCap) * 100)
    const spread = Math.round(countryScore * 0.6 + cityScore * 0.4)
  
    // ── 4. Cheer Velocity (10%) ──────────────────────────────────────────────
    // Target: 20 cheers/5min = 4/min feels live. 60+ cheers = maxed.
    const velocity = Math.round(Math.min(100, (cheerCount / 60) * 100))
  
    // ── Weighted composite ───────────────────────────────────────────────────
    const raw = density * 0.40 + emotion * 0.30 + spread * 0.20 + velocity * 0.10
  
    // Live match bonus: matches in progress get a 5-point boost (atmosphere peaks live)
    const liveBonus = minutesSinceKickoff > 0 && minutesSinceKickoff < 120 ? 5 : 0
  
    const score = Math.min(100, Math.round(raw + liveBonus))
  
    // ── Label + color ────────────────────────────────────────────────────────
    let label: string
    let color: string
    if (score >= 85)      { label = 'Legendary'; color = '#ff6b35' }
    else if (score >= 70) { label = 'Electric';  color = '#39FF76' }
    else if (score >= 45) { label = 'Building';  color = '#ffd166' }
    else                  { label = 'Tepid';     color = 'rgba(255,255,255,0.35)' }
  
    return {
      score,
      label,
      color,
      components: { density, emotion, spread, velocity },
    }
  }
  
  export function fasFromSnapshot(snapshot: {
    totalCount: number
    pulse: { fire: number; ecstatic: number; nervous: number; crushed: number; moment: number }
    countryCount: number
    cities: { city: string }[]
    cheerCount?: number
  }, sportId?: string): FASResult {
    return computeFAS({
      totalFans: snapshot.totalCount,
      pulse: snapshot.pulse,
      countryCount: snapshot.countryCount,
      cityCount: snapshot.cities?.length ?? 0,
      cheerCount: snapshot.cheerCount ?? 0,
      sportId,
    })
  }