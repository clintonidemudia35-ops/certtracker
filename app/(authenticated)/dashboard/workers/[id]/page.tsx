'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-browser'

// ─── Types ────────────────────────────────────────────────────────────────────

type Worker = { id: string; name: string; phone: string; email: string }
type Cert   = { id: string; worker_id: string; certificate_type: string; expiry_date: string; user_id: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function certStatus(expiry: string): 'Compliant' | 'Expiring Soon' | 'Expired' {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp   = new Date(expiry)
  const soon  = new Date(today); soon.setDate(today.getDate() + 30)
  if (exp < today) return 'Expired'
  if (exp <= soon)  return 'Expiring Soon'
  return 'Compliant'
}

function statusClasses(s: string) {
  if (s === 'Compliant')     return 'bg-green-100 text-green-700'
  if (s === 'Expiring Soon') return 'bg-amber-100 text-amber-700'
  if (s === 'Expired')       return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CERT_TYPES = [
  'CSCS Gold Card','CSCS Blue Card','CSCS Green Card','CSCS Red Card',
  'First Aid at Work','Emergency First Aid at Work','Asbestos Awareness',
  'Working at Height','Manual Handling','Fire Marshal',
  'IPAF (Powered Access)','PASMA (Scaffolding)','NEBOSH Certificate',
]

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {msg}
    </div>
  )
}

function inputCls() {
  return 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkerDetailPage() {
  const { id: workerId } = useParams<{ id: string }>()
  const router           = useRouter()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [worker,  setWorker]  = useState<Worker | null>(null)
  const [certs,   setCerts]   = useState<Cert[]>([])
  const [userId,  setUserId]  = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // ── Worker edit state ────────────────────────────────────────────────────────
  const [editingWorker,       setEditingWorker]       = useState(false)
  const [editName,            setEditName]            = useState('')
  const [editPhone,           setEditPhone]           = useState('')
  const [savingWorker,        setSavingWorker]        = useState(false)
  const [confirmDeleteWorker, setConfirmDeleteWorker] = useState(false)
  const [deletingWorker,      setDeletingWorker]      = useState(false)

  // ── Certificate state ────────────────────────────────────────────────────────
  const [editingCert,       setEditingCert]       = useState<Cert | null>(null)
  const [editCertType,      setEditCertType]      = useState('')
  const [editCertExpiry,    setEditCertExpiry]    = useState('')
  const [savingCert,        setSavingCert]        = useState(false)
  const [confirmDeleteCert, setConfirmDeleteCert] = useState<Cert | null>(null)
  const [deletingCert,      setDeletingCert]      = useState(false)
  const [showAddCert,       setShowAddCert]       = useState(false)
  const [newCertType,       setNewCertType]       = useState('')
  const [newCertExpiry,     setNewCertExpiry]     = useState('')

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: w, error: wErr }, { data: c }] = await Promise.all([
      supabase.from('workers').select('*').eq('id', workerId).eq('user_id', user.id).single(),
      supabase.from('certificates').select('*').eq('worker_id', workerId).eq('user_id', user.id).order('expiry_date'),
    ])

    if (wErr || !w) { router.push('/dashboard'); return }
    setWorker(w)
    setCerts(c ?? [])
    setLoading(false)
  }, [workerId, router])

  useEffect(() => { load() }, [load])

  // ── Worker handlers ──────────────────────────────────────────────────────────
  function startEditWorker() {
    if (!worker) return
    setEditName(worker.name)
    setEditPhone(worker.phone ?? '')
    setEditingWorker(true)
    setConfirmDeleteWorker(false)
  }

  async function saveWorker(e: React.FormEvent) {
    e.preventDefault()
    if (!worker || !userId) return
    setSavingWorker(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('workers')
      .update({ name: editName, phone: editPhone })
      .eq('id', worker.id).eq('user_id', userId)
      .select().single()
    setSavingWorker(false)
    if (err) { setError(err.message); return }
    setWorker(data)
    setEditingWorker(false)
  }

  async function deleteWorker() {
    if (!worker || !userId) return
    setDeletingWorker(true)
    setError(null)
    await supabase.from('certificates').delete().eq('worker_id', worker.id).eq('user_id', userId)
    const { error: err } = await supabase.from('workers').delete().eq('id', worker.id).eq('user_id', userId)
    setDeletingWorker(false)
    if (err) { setError(err.message); return }
    router.push('/dashboard')
  }

  // ── Certificate handlers ─────────────────────────────────────────────────────
  function startEditCert(cert: Cert) {
    setEditingCert(cert)
    setEditCertType(cert.certificate_type)
    setEditCertExpiry(cert.expiry_date)
    setConfirmDeleteCert(null)
    setShowAddCert(false)
  }

  async function saveCert(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCert || !userId) return
    setSavingCert(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('certificates')
      .update({ certificate_type: editCertType, expiry_date: editCertExpiry })
      .eq('id', editingCert.id).eq('user_id', userId)
      .select().single()
    setSavingCert(false)
    if (err) { setError(err.message); return }
    setCerts(prev => prev.map(c => c.id === editingCert.id ? data : c))
    setEditingCert(null)
  }

  async function deleteCert() {
    if (!confirmDeleteCert || !userId) return
    setDeletingCert(true)
    setError(null)
    const { error: err } = await supabase
      .from('certificates')
      .delete()
      .eq('id', confirmDeleteCert.id).eq('user_id', userId)
    setDeletingCert(false)
    if (err) { setError(err.message); return }
    setCerts(prev => prev.filter(c => c.id !== confirmDeleteCert.id))
    setConfirmDeleteCert(null)
  }

  async function addCert(e: React.FormEvent) {
    e.preventDefault()
    if (!worker || !userId) return
    setSavingCert(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('certificates')
      .insert([{ worker_id: worker.id, certificate_type: newCertType, expiry_date: newCertExpiry, user_id: userId }])
      .select().single()
    setSavingCert(false)
    if (err) { setError(err.message); return }
    setCerts(prev => [...prev, data].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)))
    setNewCertType('')
    setNewCertExpiry('')
    setShowAddCert(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-400">
        <Spinner />
      </div>
    )
  }

  if (!worker) return null

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Link>

        {error && <ErrorBanner msg={error} />}

        {/* ── Worker card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">

          {editingWorker ? (
            // ── Edit worker form ──────────────────────────────────────────
            <form onSubmit={saveWorker} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Edit Worker</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={inputCls()}
                    placeholder="Worker name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className={inputCls()}
                    placeholder="e.g. 07700 900123"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  {savingWorker && <Spinner />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWorker(false)}
                  className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

          ) : confirmDeleteWorker ? (
            // ── Delete worker confirmation ────────────────────────────────
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delete {worker.name}?</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This permanently deletes the worker and all {certs.length} of their certificate{certs.length !== 1 ? 's' : ''}. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteWorker}
                  disabled={deletingWorker}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  {deletingWorker && <Spinner />}
                  Yes, Delete Worker
                </button>
                <button
                  onClick={() => setConfirmDeleteWorker(false)}
                  className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

          ) : (
            // ── Worker info display ───────────────────────────────────────
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{worker.name}</h2>
                {worker.phone && (
                  <p className="text-sm text-gray-500 mt-0.5">{worker.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={startEditWorker}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => { setConfirmDeleteWorker(true); setEditingWorker(false) }}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete Worker
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Certificates section ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Certificates</h3>
              <p className="text-sm text-gray-500">{certs.length} certificate{certs.length !== 1 ? 's' : ''} on record</p>
            </div>
            <button
              onClick={() => { setShowAddCert(true); setEditingCert(null) }}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Certificate
            </button>
          </div>

          {certs.length === 0 && !showAddCert ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No certificates yet.{' '}
              <button
                onClick={() => setShowAddCert(true)}
                className="text-yellow-600 hover:underline font-medium"
              >
                Add the first one.
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Certificate Type</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">

                {certs.map(cert => {
                  const status = certStatus(cert.expiry_date)

                  // ── Inline edit row ──────────────────────────────────────
                  if (editingCert?.id === cert.id) {
                    return (
                      <tr key={cert.id} className="bg-yellow-50">
                        <td colSpan={4} className="px-6 py-4">
                          <form onSubmit={saveCert} className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-48">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type</label>
                              <input
                                required
                                list="cert-types-edit"
                                value={editCertType}
                                onChange={e => setEditCertType(e.target.value)}
                                className={inputCls()}
                                placeholder="e.g. CSCS Gold Card"
                              />
                              <datalist id="cert-types-edit">
                                {CERT_TYPES.map(t => <option key={t} value={t} />)}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                              <input
                                required
                                type="date"
                                value={editCertExpiry}
                                onChange={e => setEditCertExpiry(e.target.value)}
                                className={inputCls()}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={savingCert}
                                className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-3.5 py-2.5 rounded-lg transition-colors"
                              >
                                {savingCert && <Spinner />}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCert(null)}
                                className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )
                  }

                  // ── Delete confirmation row ──────────────────────────────
                  if (confirmDeleteCert?.id === cert.id) {
                    return (
                      <tr key={cert.id} className="bg-red-50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-700">
                              Delete <span className="font-semibold">{cert.certificate_type}</span>? This cannot be undone.
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={deleteCert}
                                disabled={deletingCert}
                                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors"
                              >
                                {deletingCert && <Spinner />}
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteCert(null)}
                                className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  // ── Normal display row ───────────────────────────────────
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{cert.certificate_type}</td>
                      <td className="px-6 py-4 text-gray-600">{fmtDate(cert.expiry_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditCert(cert)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setConfirmDeleteCert(cert); setEditingCert(null) }}
                            className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {/* ── Add certificate inline form ──────────────────────── */}
                {showAddCert && (
                  <tr className="bg-yellow-50">
                    <td colSpan={4} className="px-6 py-4">
                      <form onSubmit={addCert} className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-48">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type</label>
                          <input
                            required
                            list="cert-types-add"
                            value={newCertType}
                            onChange={e => setNewCertType(e.target.value)}
                            className={inputCls()}
                            placeholder="e.g. CSCS Gold Card"
                          />
                          <datalist id="cert-types-add">
                            {CERT_TYPES.map(t => <option key={t} value={t} />)}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                          <input
                            required
                            type="date"
                            value={newCertExpiry}
                            onChange={e => setNewCertExpiry(e.target.value)}
                            className={inputCls()}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingCert}
                            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-3.5 py-2.5 rounded-lg transition-colors"
                          >
                            {savingCert && <Spinner />}
                            Add Certificate
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddCert(false)}
                            className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
