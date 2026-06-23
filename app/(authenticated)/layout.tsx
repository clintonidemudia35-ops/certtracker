import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SidebarWrapper from '@/components/SidebarWrapper'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Gate the entire dashboard behind onboarding — if account_type is not set yet,
  // redirect to the welcome screen so the user picks before reaching the dashboard.
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (!profile?.account_type) redirect('/onboarding')

  return <SidebarWrapper accountType={profile.account_type}>{children}</SidebarWrapper>
}
