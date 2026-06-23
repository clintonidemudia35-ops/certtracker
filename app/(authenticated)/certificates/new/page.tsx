'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

// ─── Certificate type groups ───────────────────────────────────────────────────

const CERT_TYPE_GROUPS: Record<string, string[]> = {
  'UK': [
    'CSCS Card',
    'IPAF',
    'PASMA',
    'First Aid at Work',
    'Asbestos Awareness',
    'SSSTS',
    'SMSTS',
  ],
  'United States': [
    'OSHA 10',
    'OSHA 30',
    'First Aid/CPR',
    'Scaffold Certification',
    'Forklift Certification',
  ],
  'Australia': [
    'White Card',
    'Working at Heights',
    'EWP Licence',
  ],
  'Canada': [
    'WHMIS',
    'Fall Protection',
    'First Aid',
  ],
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Worker = { id: string; name: string }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCertificatePage() {
  const router = useRouter()

  const [workers,       setWorkers]      = useState<Worker[]>([])
  const [workerId,      setWorkerId]     = useState('')
  const [selectValue,   setSelectValue]  = useState('')
  const [customCert,    setCustomCert]   = useState('')
  const [selectedFile,  setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [expiryDate,    setExpiryDate]   = useState('')
  const [userId,        setUserId]       = useState<string | null>(null)
  const [accountType,   setAccountType]  = useState<string | null>(null)
  const [saving,        setSaving]       = useState(false)
  const [success,       setSuccess]      = useState(false)
  const [error,         setError]        = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCustom = selectValue === '__custom__'
  const certType = isCustom ? customCert.trim() : selectValue

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id ?? null
      setUserId(uid)
      if (!uid) return

      const [{ data: workerData }, { data: profileData }] = await Promise.all([
        supabase.from('workers').select('id, name').order('name'),
        supabase.from('profiles').select('account_type').eq('id', uid).single(),
      ])

      if (workerData) setWorkers(workerData)
      const aType = profileData?.account_type ?? null
      setAccountType(aType)
      // For individual users, silently pre-select their only worker
      if (aType === 'individual' && workerData && workerData.length > 0) {
        setWorkerId(workerData[0].id)
      }
    }
    load()
  }, [])

  // Revoke object URL when filePreviewUrl changes (or on unmount)
  useEffect(() => {
    return () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl) }
  }, [filePreviewUrl])

  // ── File selection ─────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setError(null)
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file))
    } else {
      setFilePreviewUrl(null)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    setFilePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId)   { setError('Please select a worker.');                    return }
    if (!certType)   { setError('Please select or enter a certificate type.'); return }
    if (!expiryDate) { setError('Please enter an expiry date.');               return }

    setSaving(true)
    setError(null)
    setSuccess(false)

    // Insert cert and get its ID so we can name the storage path
    const { data: certData, error: insertError } = await supabase
      .from('certificates')
      .insert([{ worker_id: workerId, certificate_type: certType, expiry_date: expiryDate, user_id: userId }])
      .select('id')
      .single()

    if (insertError || !certData) {
      setSaving(false)
      setError(insertError?.message ?? 'Failed to save certificate.')
      return
    }

    // Upload file to private storage (non-fatal — cert is saved regardless)
    if (selectedFile && userId) {
      const filePath = `${userId}/${certData.id}/${selectedFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, selectedFile, { contentType: selectedFile.type })
      if (!uploadError) {
        await supabase.from('certificates').update({ file_path: filePath }).eq('id', certData.id)
      }
    }

    setSaving(false)
    setSuccess(true)
    setWorkerId('')
    setSelectValue('')
    setCustomCert('')
    clearFile()
    setExpiryDate('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Add Certificate</h2>
          <p className="text-sm text-gray-500 mt-1">Enter the certificate details. Optionally attach a photo or PDF for your records.</p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Certificate saved successfully!
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Worker — hidden for individual users (auto-selected) */}
            {accountType !== 'individual' && (
              <div>
                <label htmlFor="worker" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Worker <span className="text-red-500">*</span>
                </label>
                <select
                  id="worker"
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                >
                  <option value="">Select a worker...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Certificate type */}
            <div>
              <label htmlFor="certType" className="block text-sm font-medium text-gray-700 mb-1.5">
                Certificate Type <span className="text-red-500">*</span>
              </label>
              <select
                id="certType"
                value={selectValue}
                onChange={(e) => {
                  setSelectValue(e.target.value)
                  if (e.target.value !== '__custom__') setCustomCert('')
                }}
                required={!isCustom}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
              >
                <option value="">Select certificate type...</option>
                {Object.entries(CERT_TYPE_GROUPS).map(([region, certs]) => (
                  <optgroup key={region} label={region}>
                    {certs.map((cert) => (
                      <option key={cert} value={cert}>{cert}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__custom__">Custom certificate...</option>
              </select>

              {isCustom && (
                <input
                  type="text"
                  required
                  autoFocus
                  value={customCert}
                  onChange={(e) => setCustomCert(e.target.value)}
                  placeholder="Enter certificate name"
                  className="mt-2.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                />
              )}
            </div>

            {/* Expiry date */}
            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1.5">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
              />
            </div>

            {/* Certificate document (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Certificate Document{' '}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>

              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  {filePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreviewUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-12 w-12 rounded bg-gray-200 shrink-0">
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm">Click to upload a photo or PDF</span>
                    <span className="text-xs">JPG, PNG, WEBP, PDF</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving...
                  </>
                ) : 'Save Certificate'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
