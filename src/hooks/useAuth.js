import { useEffect, useState } from 'react'
import { hasSupabase, supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signup = async (email, password) => {
    if (!hasSupabase) return { error: { message: 'Supabase not configured' } }
    return supabase.auth.signUp({ email, password })
  }

  const login = async (email, password) => {
    if (!hasSupabase) return { error: { message: 'Supabase not configured' } }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const logout = async () => {
    if (!hasSupabase) return
    await supabase.auth.signOut()
  }

  return { session, user: session?.user || null, loading, signup, login, logout, hasSupabase }
}
