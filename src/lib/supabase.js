import { createClient } from '@supabase/supabase-js'

const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined
const supabaseUrl = (viteEnv && viteEnv.VITE_SUPABASE_URL) || process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = (viteEnv && viteEnv.VITE_SUPABASE_ANON_KEY) || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env (or VITE_* if using Vite), then restart the dev server.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
