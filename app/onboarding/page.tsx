'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

type AccountType = 'individual' | 'business'

const OPTIONS: { value: AccountType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value:       'individual',
    label:       'Individual',
    description: 'Track your own certifications.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    value:       'business',
    label:       'Business',
    description: 'Manage certifications for your whole team.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
]

export default function OnboardingPage() {
  const router = useRouter()

  const [userId,         setUserId]         = useState<string | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [choice,         setChoice]         = useState<AccountType | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [showVerified,   setShowVerified]   = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // If they already completed onboarding, skip straight to the dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single()

      if (profile?.account_type) { router.replace('/dashboard'); return }

      // Show verified banner only when arriving from the email callback
      if (new URLSearchParams(window.location.search).get('verified') === '1') {
        setShowVerified(true)
      }

      setUserId(user.id)
    }
    init()
  }, [router])

  async function handleChoose(accountType: AccountType) {
    if (!userId || saving) return
    setChoice(accountType)
    setSaving(true)
    setError(null)

    // Save account type
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, account_type: accountType }, { onConflict: 'id' })

    if (upsertError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      setChoice(null)
      return
    }

    // For individual users, create a single self-worker (once only — skip if one exists)
    if (accountType === 'individual') {
      const { data: existing } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!existing || existing.length === 0) {
        await supabase
          .from('workers')
          .insert({ name: 'My Certifications', user_id: userId })
      }
    }

    router.replace('/dashboard')
  }

  // Render nothing while the auth/profile check is in flight
  if (!userId) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/certtracker-lockup.svg" alt="CertWith" style={{ width: '180px', height: 'auto' }} />
      </div>

      {/* Verified banner */}
      {showVerified && (
        <div className="w-full max-w-xl mb-4 flex items-center justify-between gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Email verified — welcome to CertWith</span>
          </div>
          <button
            onClick={() => setShowVerified(false)}
            className="shrink-0 text-green-600 hover:text-green-800 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            How will you use CertWith?
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This helps us set up CertWith for you.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map(opt => {
            const isChosen  = choice === opt.value
            const isLoading = saving && isChosen
            const isDisabled = saving

            return (
              <button
                key={opt.value}
                onClick={() => handleChoose(opt.value)}
                disabled={isDisabled}
                className={`
                  relative flex flex-col items-center text-center gap-4 rounded-xl border-2 p-7
                  transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400
                  ${isChosen
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/40'}
                  ${isDisabled && !isChosen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Icon circle */}
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ background: '#1f2a44', color: '#FFD23F' }}
                >
                  {isLoading ? (
                    <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : opt.icon}
                </div>

                <div>
                  <p className="text-base font-bold text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{opt.description}</p>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
