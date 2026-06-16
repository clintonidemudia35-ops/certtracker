import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Plain server-side client used by server components for DB queries.
// Client components that need auth (login, etc.) use lib/supabase-browser.ts instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
