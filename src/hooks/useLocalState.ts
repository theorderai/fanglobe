'use client'
import { useCallback, useEffect, useState } from 'react'

/** Small localStorage-backed state, used to remember your side and votes per device. */
export function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) setValue(JSON.parse(raw) as T)
    } catch { /* ignore */ }
  }, [key])

  const update = useCallback((next: T) => {
    setValue(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
  }, [key])

  return [value, update] as const
}
