/**
 * Spike detection on the "bad call!" tap timeseries.
 *
 * `counts` is oldest → newest, one entry per bucket; the last entry is the
 * current (possibly still filling) bucket. A spike is when the current bucket
 * is well above the recent baseline AND above an absolute floor, so a quiet
 * match with 3 taps doesn't open an incident.
 */
export interface SpikeOptions {
  /** How many standard deviations above the baseline mean counts as a spike. */
  sigma?: number
  /** Absolute minimum taps in the current bucket. */
  minTaps?: number
  /** Current bucket must also be at least this multiple of the baseline mean. */
  minRatio?: number
}

export interface SpikeResult {
  spike: boolean
  current: number
  baselineMean: number
  threshold: number
}

export function detectSpike(counts: number[], opts: SpikeOptions = {}): SpikeResult {
  const { sigma = 3, minTaps = 20, minRatio = 2.5 } = opts
  const current = counts[counts.length - 1] ?? 0
  const baseline = counts.slice(0, -1)

  const mean = baseline.length ? baseline.reduce((a, b) => a + b, 0) / baseline.length : 0
  const variance = baseline.length
    ? baseline.reduce((a, b) => a + (b - mean) ** 2, 0) / baseline.length
    : 0
  const std = Math.sqrt(variance)

  const threshold = Math.max(minTaps, mean + sigma * std, mean * minRatio)
  return { spike: current >= threshold, current, baselineMean: mean, threshold }
}
