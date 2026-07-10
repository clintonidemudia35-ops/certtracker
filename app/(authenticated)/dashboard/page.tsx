import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Worker = {
  id: string
  name: string
}

type Certificate = {
  id: string
  worker_id: string
  certificate_type: string
  expiry_date: string
}

function getCertStatus(expiryDate: string): 'Compliant' | 'Expiring Soon' | 'Expired' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  if (expiry < today) return 'Expired'
  if (expiry <= in30Days) return 'Expiring Soon'
  return 'Compliant'
}

function statusBadge(status: string) {
  switch (status) {
    case 'Compliant':     return 'bg-green-100 text-green-700'
    case 'Expiring Soon': return 'bg-amber-100 text-amber-700'
    case 'Expired':       return 'bg-red-100 text-red-700'
    default:              return 'bg-gray-100 text-gray-600'
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: workers }, { data: certificates }, { data: profile }] = await Promise.all([
    supabase.from('workers').select('*').eq('user_id', user?.id ?? '').order('name'),
    supabase.from('certificates').select('*').eq('user_id', user?.id ?? '').order('expiry_date'),
    supabase.from('profiles').select('account_type').eq('id', user?.id ?? '').single(),
  ])

  const workerList: Worker[]      = workers      ?? []
  const certList:   Certificate[] = certificates ?? []
  const accountType               = profile?.account_type ?? 'business'

  // ── INDIVIDUAL view ──────────────────────────────────────────────────────────
  if (accountType === 'individual') {
    const selfWorker    = workerList[0] ?? null
    const totalCerts    = certList.length
    const expiringSoon  = certList.filter(c => getCertStatus(c.expiry_date) === 'Expiring Soon').length
    const compliant     = certList.filter(c => getCertStatus(c.expiry_date) === 'Compliant').length

    return (
      <div className="bg-gray-50 min-h-full">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">My Certifications</h2>
              <p className="text-sm text-gray-500 mt-1">Your certification status and upcoming renewals</p>
            </div>
            <Link
              href="/certificates/new"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Certificate
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Certificates</p>
                <p className="text-3xl font-bold text-gray-900">{totalCerts}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-amber-50">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-3xl font-bold text-amber-600">{expiringSoon}</p>
                <p className="text-xs text-gray-400">within 30 days</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-green-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Compliant</p>
                <p className="text-3xl font-bold text-green-600">{compliant}</p>
              </div>
            </div>

          </div>

          {/* Certificates table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Certificates</h3>
              <p className="text-sm text-gray-500">All your certifications and their status</p>
            </div>

            <div className="overflow-x-auto">
              {certList.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No certificates yet.{' '}
                  <Link href="/certificates/new" className="text-yellow-600 hover:underline font-medium">
                    Add your first certificate.
                  </Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3">Certificate Type</th>
                      <th className="px-6 py-3">Expiry Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {certList.map((cert) => {
                      const status   = getCertStatus(cert.expiry_date)
                      const editHref = selfWorker ? `/dashboard/workers/${selfWorker.id}?editCert=${cert.id}` : '#'
                      return (
                        <tr key={cert.id} className="hover:bg-yellow-50 transition-colors cursor-pointer">
                          <td className="font-medium text-gray-900">
                            <Link href={editHref} className="block px-6 py-4">
                              {cert.certificate_type}
                            </Link>
                          </td>
                          <td className="text-gray-600">
                            <Link href={editHref} className="block px-6 py-4">
                              {new Date(cert.expiry_date).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Link>
                          </td>
                          <td>
                            <Link href={editHref} className="block px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(status)}`}>
                                {status}
                              </span>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── BUSINESS view (default) ───────────────────────────────────────────────────

  const certsByWorker = certList.reduce<Record<string, Certificate[]>>((acc, cert) => {
    if (!acc[cert.worker_id]) acc[cert.worker_id] = []
    acc[cert.worker_id].push(cert)
    return acc
  }, {})

  const rows = workerList.flatMap((worker) => {
    const certs = certsByWorker[worker.id] ?? []
    if (certs.length === 0) return [{ worker, cert: null as Certificate | null }]
    return certs.map((cert) => ({ worker, cert }))
  })

  const totalWorkers = workerList.length

  const expiringSoon = workerList.filter((w) =>
    (certsByWorker[w.id] ?? []).some((c) => getCertStatus(c.expiry_date) === 'Expiring Soon')
  ).length

  const compliant = workerList.filter((w) => {
    const certs = certsByWorker[w.id] ?? []
    return certs.length > 0 && certs.every((c) => getCertStatus(c.expiry_date) === 'Compliant')
  }).length

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Page title */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Overview of your workforce compliance status</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/certificates/new"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Certificate
            </Link>
            <Link
              href="/workers/new"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Worker
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900">{totalWorkers}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-amber-50">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-3xl font-bold text-amber-600">{expiringSoon}</p>
              <p className="text-xs text-gray-400">within 30 days</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-200 p-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-green-50">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Compliant Workers</p>
              <p className="text-3xl font-bold text-green-600">{compliant}</p>
            </div>
          </div>

        </div>

        {/* Workers table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Workers</h3>
            <p className="text-sm text-gray-500">All workers and their latest certification status</p>
          </div>

          <div className="overflow-x-auto">
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No workers found.{' '}
                <Link href="/workers/new" className="text-yellow-600 hover:underline font-medium">
                  Add your first worker.
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Certificate Type</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(({ worker, cert }, i) => {
                    const status = cert ? getCertStatus(cert.expiry_date) : 'No Certificate'
                    return (
                      <tr key={`${worker.id}-${cert?.id ?? i}`} className="hover:bg-yellow-50 transition-colors cursor-pointer">
                        <td className="font-medium text-gray-900">
                          <Link href={`/dashboard/workers/${worker.id}`} className="block px-6 py-4 hover:text-yellow-700 transition-colors">
                            {worker.name}
                          </Link>
                        </td>
                        <td className="text-gray-600">
                          <Link href={`/dashboard/workers/${worker.id}`} className="block px-6 py-4">
                            {cert?.certificate_type ?? '—'}
                          </Link>
                        </td>
                        <td className="text-gray-600">
                          <Link href={`/dashboard/workers/${worker.id}`} className="block px-6 py-4">
                            {cert
                              ? new Date(cert.expiry_date).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })
                              : '—'}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/dashboard/workers/${worker.id}`} className="block px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(status)}`}>
                              {status}
                            </span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
