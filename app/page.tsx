import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

// Derives status from an expiry date string
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

// Returns Tailwind classes for each status badge
function statusBadge(status: string) {
  switch (status) {
    case 'Compliant':     return 'bg-green-100 text-green-700'
    case 'Expiring Soon': return 'bg-amber-100 text-amber-700'
    case 'Expired':       return 'bg-red-100 text-red-700'
    default:              return 'bg-gray-100 text-gray-600'
  }
}

export default async function DashboardPage() {
  // Fetch workers and certificates in parallel
  const [{ data: workers }, { data: certificates }] = await Promise.all([
    supabase.from('workers').select('*').order('name'),
    supabase.from('certificates').select('*').order('expiry_date'),
  ])

  const workerList: Worker[]      = workers      ?? []
  const certList:   Certificate[] = certificates ?? []

  // Group certificates by worker_id for quick lookup
  const certsByWorker = certList.reduce<Record<string, Certificate[]>>((acc, cert) => {
    if (!acc[cert.worker_id]) acc[cert.worker_id] = []
    acc[cert.worker_id].push(cert)
    return acc
  }, {})

  // Build flat table rows — one row per certificate; workers with no certs get one empty row
  const rows = workerList.flatMap((worker) => {
    const certs = certsByWorker[worker.id] ?? []
    if (certs.length === 0) {
      return [{ worker, cert: null as Certificate | null }]
    }
    return certs.map((cert) => ({ worker, cert }))
  })

  // Calculate stats
  const totalWorkers = workerList.length

  const expiringSoon = workerList.filter((w) =>
    (certsByWorker[w.id] ?? []).some((c) => getCertStatus(c.expiry_date) === 'Expiring Soon')
  ).length

  const compliant = workerList.filter((w) => {
    const certs = certsByWorker[w.id] ?? []
    return certs.length > 0 && certs.every((c) => getCertStatus(c.expiry_date) === 'Compliant')
  }).length

  return (
    <div className="min-h-screen bg-gray-50">

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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Page title */}
        <div className="flex items-center justify-between">
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
                No workers found. <Link href="/workers/new" className="text-yellow-600 hover:underline font-medium">Add your first worker.</Link>
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
                      <tr key={`${worker.id}-${cert?.id ?? i}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{worker.name}</td>
                        <td className="px-6 py-4 text-gray-600">{cert?.certificate_type ?? '—'}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {cert
                            ? new Date(cert.expiry_date).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
