import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client. Uses @supabase/ssr which stores the session in
// chunked cookies (not localStorage) so Next.js middleware can read it server-side.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
