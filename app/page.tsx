import Link from 'next/link'

// Placeholder data — replace with real Supabase queries later
const stats = {
  totalWorkers: 24,
  expiringSoon: 5,
  compliant: 19,
}

const workers = [
  { id: 1, name: 'James Carter',    cert: 'CSCS Gold Card',       expiry: '2026-06-28', status: 'Expiring Soon' },
  { id: 2, name: 'Sarah Mitchell',  cert: 'First Aid at Work',    expiry: '2026-06-15', status: 'Expiring Soon' },
  { id: 3, name: 'Tom Hughes',      cert: 'CSCS Blue Card',       expiry: '2027-03-10', status: 'Compliant'     },
  { id: 4, name: 'Priya Patel',     cert: 'Asbestos Awareness',   expiry: '2026-07-01', status: 'Expiring Soon' },
  { id: 5, name: 'Lee Barnett',     cert: 'CSCS Green Card',      expiry: '2028-01-22', status: 'Compliant'     },
  { id: 6, name: 'Emma Walsh',      cert: 'Manual Handling',      expiry: '2027-09-14', status: 'Compliant'     },
  { id: 7, name: 'Dan Fowler',      cert: 'CSCS Gold Card',       expiry: '2025-11-30', status: 'Expired'       },
  { id: 8, name: 'Yusuf Okafor',    cert: 'Fire Marshal',         expiry: '2026-06-20', status: 'Expiring Soon' },
  { id: 9, name: 'Claire Deacon',   cert: 'CSCS Blue Card',       expiry: '2027-05-03', status: 'Compliant'     },
  { id: 10, name: 'Rob Sinclair',   cert: 'Working at Height',    expiry: '2026-12-18', status: 'Compliant'     },
]

// Returns Tailwind classes for each status badge
function statusBadge(status: string) {
  switch (status) {
    case 'Compliant':     return 'bg-green-100 text-green-700'
    case 'Expiring Soon': return 'bg-amber-100 text-amber-700'
    case 'Expired':       return 'bg-red-100 text-red-700'
    default:              return 'bg-gray-100 text-gray-600'
  }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* Logo mark */}
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
              <p className="text-3xl font-bold text-gray-900">{stats.totalWorkers}</p>
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
              <p className="text-3xl font-bold text-amber-600">{stats.expiringSoon}</p>
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
              <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
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
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{worker.name}</td>
                    <td className="px-6 py-4 text-gray-600">{worker.cert}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(worker.expiry).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(worker.status)}`}>
                        {worker.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
