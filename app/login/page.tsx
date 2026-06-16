'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [signUpSent, setSignUpSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signin') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (authError) {
        setError(authError.message)
      } else {
        router.push('/')
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (authError) {
        setError(authError.message)
      } else {
        setSignUpSent(true)
      }
    }
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setSignUpSent(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-400">
            <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">CertTracker</h1>
            <p className="text-xs text-gray-500 leading-tight">Construction Certification Manager</p>
          </div>
        </div>
      </header>

      {/* Centred card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'signin'
                ? 'Welcome back — enter your details below'
                : 'Get started with CertTracker today'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">

            {/* Sign-up confirmation */}
            {signUpSent ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to activate your account.
                  </p>
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

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                  />
                </div>

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
                      {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    mode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </button>

              </form>
            )}
          </div>

          {/* Mode toggle */}
          {!signUpSent && (
            <p className="text-center text-sm text-gray-500 mt-5">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('signin')}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
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
