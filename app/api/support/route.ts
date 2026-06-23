import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated
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
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const subject = (body?.subject ?? '').trim()
  const message = (body?.message ?? '').trim()

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  const userEmail = user.email ?? 'unknown'

  const result = await resend.emails.send({
    from:    'CertWith Support <onboarding@resend.dev>',
    to:      'clintidd@gmail.com',
    replyTo: userEmail,
    subject: `CertWith support: ${subject}`,
    text: [
      `From: ${userEmail}`,
      '',
      `Subject: ${subject}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  })

  if (result.error) {
    console.error('[support] Resend error:', result.error)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
