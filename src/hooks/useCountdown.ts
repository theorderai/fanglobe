'use client'
import { useState, useEffect } from 'react'

export function useCountdown(kickoffAt: string): string {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(kickoffAt).getTime() - Date.now())
      if (diff === 0) {
        setDisplay('LIVE')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      if (h > 0) {
        setDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      } else {
        setDisplay(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [kickoffAt])

  return display
}
