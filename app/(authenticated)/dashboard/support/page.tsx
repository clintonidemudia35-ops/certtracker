'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function SupportPage() {
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)

    // getUser() is safe to call on the client — reads from the existing session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to send a message.')
      setSending(false)
      return
    }

    const res = await fetch('/api/support', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subject: subject.trim(), message: message.trim() }),
    })

    const json = await res.json().catch(() => ({}))
    setSending(false)

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSent(true)
    setSubject('')
    setMessage('')
  }

  function handleAnother() {
    setSent(false)
    setError(null)
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Contact support</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6">

          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Message sent</p>
                <p className="text-sm text-gray-500 mt-1">We&apos;ll get back to you soon.</p>
              </div>
              <button
                onClick={handleAnother}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="What can we help with?"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {sending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {sending ? 'Sending…' : 'Send message'}
              </button>

            </form>
          )}

        </section>
      </div>
    </div>
  )
}
