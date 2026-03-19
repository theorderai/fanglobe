'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAnonymous: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, profile: null, loading: true, isAnonymous: true,
  })

  const supabase = getSupabaseClient()

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data as UserProfile | null
    } catch { return null }
  }, [supabase])

  const ensureAnonymousSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, session, profile, loading: false, isAnonymous: session.user.is_anonymous ?? true })
        return
      }
      // Create anonymous session
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data.session) {
        console.error('Anon sign-in failed:', error?.message)
        // Still mark loading as done so UI isn't blocked
        setState(s => ({ ...s, loading: false }))
        return
      }
      const profile = await fetchProfile(data.user!.id)
      setState({ user: data.user!, session: data.session, profile, loading: false, isAnonymous: true })
    } catch (err) {
      console.error('Auth error:', err)
      setState(s => ({ ...s, loading: false }))
    }
  }, [supabase, fetchProfile])

  useEffect(() => {
    ensureAnonymousSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) return
      const profile = await fetchProfile(session.user.id)
      setState({ user: session.user, session, profile, loading: false, isAnonymous: session.user.is_anonymous ?? true })
    })
    return () => subscription.unsubscribe()
  }, [ensureAnonymousSession, supabase, fetchProfile])

  const upgradeWithEmail = useCallback(async (email: string) => {
    return supabase.auth.updateUser({ email })
  }, [supabase])

  const upgradeWithGoogle = useCallback(async () => {
    return supabase.auth.linkIdentity({ provider: 'google' })
  }, [supabase])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('profiles').upsert({ id: state.user.id, ...updates, updated_at: new Date().toISOString() })
      .select().single()
    if (!error && data) setState(s => ({ ...s, profile: data as UserProfile }))
    return { error }
  }, [state.user, supabase])

  return {
    ...state,
    accessToken: state.session?.access_token ?? null,
    upgradeWithEmail,
    upgradeWithGoogle,
    updateProfile,
  }
}
