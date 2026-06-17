import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Creates a Supabase client for use in server components, server actions, and
// route handlers. Reads the session from request cookies via next/headers so
// auth.getUser() returns the signed-in user instead of null.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
