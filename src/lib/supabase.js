import { createClient } from '@supabase/supabase-js'

const defaultUrl = 'https://vzduymscsnuwbolucnag.supabase.co'
const defaultKey = 'sb_publishable_ghU7U0ZmZ95f7PhjMvuZLw_Io4N_BMZ'

const url = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey

export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url, key) : null
