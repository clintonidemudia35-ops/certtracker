import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Root route: send authenticated users to the dashboard, everyone else to the landing page.
export default async function RootPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/landing')
  }
}
