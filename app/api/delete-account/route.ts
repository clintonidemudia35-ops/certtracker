import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE() {
  console.log('SERVICE KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('SERVICE KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)
  console.log('SERVICE KEY prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 6))
  console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const cookieStore = await cookies()

  // Authenticate the calling user via their session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Delete the auth user FIRST — if this fails we return early and touch nothing else
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteUserError) {
    console.error('delete-account: auth.admin.deleteUser failed', JSON.stringify(deleteUserError))
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
  }

  // Auth user is gone — now clean up their data (non-fatal if any of these fail)
  const [certsResult, workersResult] = await Promise.all([
    supabase.from('certificates').delete().eq('user_id', userId),
    supabase.from('workers').delete().eq('user_id', userId),
  ])

  if (certsResult.error)   console.error('delete-account: certs error', certsResult.error)
  if (workersResult.error) console.error('delete-account: workers error', workersResult.error)

  await supabase.storage.from('avatars').remove([`${userId}/avatar`])

  return NextResponse.json({ success: true })
}
