import { supabase, hasSupabase } from '../lib/supabase'

const STORAGE_KEY = 'fittrack-local-state'

export function saveLocalState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadLocalState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function saveCloudState(userId, state) {
  if (!hasSupabase || !userId) return

  await supabase.from('user_state').upsert({
    user_id: userId,
    payload: state,
    updated_at: new Date().toISOString()
  })
}

export async function loadCloudState(userId) {
  if (!hasSupabase || !userId) return null

  const { data } = await supabase
    .from('user_state')
    .select('payload')
    .eq('user_id', userId)
    .single()

  return data?.payload || null
}
