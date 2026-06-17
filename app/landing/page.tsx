import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400">
              <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">CertTracker</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Built for UK construction
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Never Let a{' '}
            <span className="relative inline-block">
              <span className="relative z-10">CSCS Card</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-yellow-300 -z-10 rounded" />
            </span>
            {' '}Expire Again
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            CertTracker automatically tracks your workforce certifications and sends
            WhatsApp alerts before they expire — keeping your site compliant.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>

        </section>

        {/* ── Benefit cards ──────────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-t border-gray-100 py-20 px-6">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">Everything you need to stay compliant</h2>
              <p className="text-gray-500 mt-2 text-sm">From card scanning to automated alerts — all in one place.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Card 1 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-400">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">Instant Card Scanning</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Upload a photo of any CSCS card or certificate and we automatically extract the worker's name and expiry date using OCR.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-400">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">Automated WhatsApp Alerts</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Workers get a WhatsApp message 30 days before their certification expires — no spreadsheets, no chasing, no surprises on site.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-400">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">Live Compliance Dashboard</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    See your entire workforce compliance status at a glance — who's compliant, who's expiring soon, and who needs immediate action.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to stay compliant?</h2>
            <p className="text-gray-500 text-sm mb-8">Set up in minutes. No credit card required.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>© 2026 CertTracker</span>
          <span>Built for UK construction</span>
        </div>
      </footer>

    </div>
  )
}
