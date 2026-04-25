import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzduymscsnuwbolucnag.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ghU7U0ZmZ95f7PhjMvuZLw_Io4N_BMZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
