'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

type Mode = 'signin' | 'signup' | 'forgot'

// ─── Signup email validation ───────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'mailinator.net',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.info',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'spam4.me',
  'yopmail.com', 'yopmail.fr',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.io',
  'dispostable.com', 'discard.email',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  'throwam.com', 'throwaway.email',
  'fakeinbox.com', 'mailnesia.com', 'maildrop.cc',
  'mailnull.com', 'mailsac.com',
  'spamgourmet.com', 'spamgourmet.net',
  'getairmail.com', 'mohmal.com',
])

const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com':    'gmail.com',
  'gmai.com':     'gmail.com',
  'gamil.com':    'gmail.com',
  'gmail.co':     'gmail.com',
  'gmaill.com':   'gmail.com',
  'gnail.com':    'gmail.com',
  'gmail.con':    'gmail.com',
  'hotmial.com':  'hotmail.com',
  'htomail.com':  'hotmail.com',
  'hotmail.co':   'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con':  'hotmail.com',
  'yahooo.com':   'yahoo.com',
  'yaho.com':     'yahoo.com',
  'yaoo.com':     'yahoo.com',
  'yahoo.co':     'yahoo.com',
  'yahoo.con':    'yahoo.com',
  'outlok.com':   'outlook.com',
  'outllook.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'outlook.co':   'outlook.com',
  'iclod.com':    'icloud.com',
  'icould.com':   'icloud.com',
  'icloud.co':    'icloud.com',
}

function validateSignupEmail(raw: string): string | null {
  const email  = raw.trim()
  const valid  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  if (!valid) return 'Please enter a valid email address.'

  const domain = email.split('@')[1].toLowerCase()

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'Please use a permanent email address — temporary or disposable addresses are not accepted.'
  }

  const correction = DOMAIN_TYPOS[domain]
  if (correction) {
    const local = email.split('@')[0]
    return `Did you mean ${local}@${correction}? Please correct your email address.`
  }

  return null
}

function friendlyAuthError(err: { message: string; status?: number }): string {
  if (
    err.status === 429 ||
    err.message.toLowerCase().includes('rate limit') ||
    err.message.toLowerCase().includes('too many')
  ) {
    return 'Too many sign-up attempts right now. Please wait a few minutes and try again.'
  }
  return err.message
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode]               = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  )
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (mode === 'signin') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (authError) {
        setError(friendlyAuthError(authError))
      } else {
        router.push('/dashboard')
      }

    } else if (mode === 'signup') {
      const emailError = validateSignupEmail(email)
      if (emailError) {
        setLoading(false)
        setError(emailError)
        return
      }

      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setLoading(false)
      if (authError) {
        setError(friendlyAuthError(authError))
      } else if (signUpData.session) {
        // Email confirmation is disabled — session is returned immediately
        router.push('/onboarding')
      } else {
        // Fallback: confirmation still required (should not happen in current config)
        setSuccessMsg(`We sent a confirmation link to ${email}. Click it to activate your account.`)
      }

    } else {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      setLoading(false)
      if (authError) {
        setError(friendlyAuthError(authError))
      } else {
        setSuccessMsg(`Password reset email sent to ${email}. Check your inbox.`)
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccessMsg(null)
  }

  const title = mode === 'signin' ? 'Sign in to your account'
              : mode === 'signup' ? 'Create an account'
              : 'Reset your password'

  const subtitle = mode === 'signup' ? 'Get started with CertWith today'
                 : mode === 'forgot'  ? 'Enter your email and we\'ll send you a reset link'
                 : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certtracker-lockup.svg" alt="CertWith" style={{ width: '200px', height: 'auto' }} />
        </div>
      </header>

      {/* Centred card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">

            {/* Success state */}
            {successMsg ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-500 mt-1">{successMsg}</p>
                </div>
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error banner */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                  />
                </div>

                {/* Password — hidden on forgot flow */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          /* Eye-off icon */
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          /* Eye icon */
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…'}
                    </>
                  ) : (
                    mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'
                  )}
                </button>

              </form>
            )}
          </div>

          {/* Mode toggle */}
          {!successMsg && (
            <p className="text-center text-sm text-gray-500 mt-5">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('signin')} className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}

        </div>
      </main>

    </div>
  )
}

// useSearchParams() requires a Suspense boundary to allow static prerendering.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
