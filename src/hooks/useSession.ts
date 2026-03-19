'use client'
import { useState, useEffect } from 'react'

function generateSessionId(): string {
  return `kw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function useSession(): string {
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    const KEY = 'kw_session_id'
    let sid = localStorage.getItem(KEY)
    if (!sid) {
      sid = generateSessionId()
      localStorage.setItem(KEY, sid)
    }
    setSessionId(sid)
  }, [])

  return sessionId
}
