import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a passthrough response that we may replace with a redirect
  let response = NextResponse.next({ request })

  // createServerClient from @supabase/ssr reads/writes chunked cookies on the
  // request and response, which is what the browser client (supabase-browser.ts)
  // also writes — so both sides speak the same cookie format.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propagate any cookie updates (e.g. refreshed token) into both
          // the request and the response so they stay in sync.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() makes a server-side round-trip to Supabase to validate the token.
  // Prefer this over getSession() in middleware — getSession() only reads the
  // local cookie without validating, so a tampered cookie could bypass the check.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth required
  // /auth/callback must be reachable without a session so the code-exchange can run
  const isPublic = pathname === '/' || pathname === '/login' || pathname.startsWith('/landing') || pathname === '/auth/callback'

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users don't need the landing page or login — send to dashboard
  if (user && (pathname === '/' || pathname === '/login' || pathname.startsWith('/landing'))) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and any path with a file extension.
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:mp4|mp3|webm|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|pdf|txt|xml|json)$).*)',
  ],
}
