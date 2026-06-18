'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

// ─── Certificate type groups ───────────────────────────────────────────────────
// "Custom certificate" is handled separately — it reveals a free-text input.

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

// ─── OCR helpers ──────────────────────────────────────────────────────────────

function extractExpiryDate(text: string): string {
  const lines = text.split('\n')
  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})\b/i,
  ]
  const expiryKeywords = ['expir', 'valid until', 'renewal', 'use by']

  for (const line of lines) {
    if (expiryKeywords.some((kw) => line.toLowerCase().includes(kw))) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern)
        if (match) return match[0]
      }
    }
  }

  let lastDate = ''
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) lastDate = match[0]
    }
  }
  return lastDate
}

function toInputDate(raw: string): string {
  const dmy = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const dMonthY = raw.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/i)
  if (dMonthY) {
    const months: Record<string, string> = {
      jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
      jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    }
    const [, d, mon, y] = dMonthY
    return `${y}-${months[mon.toLowerCase().slice(0, 3)]}-${d.padStart(2, '0')}`
  }
  return ''
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Worker = { id: string; name: string }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCertificatePage() {
  const router = useRouter()

  const [workers,      setWorkers]      = useState<Worker[]>([])
  const [workerId,     setWorkerId]     = useState('')
  const [selectValue,  setSelectValue]  = useState('')       // what the <select> shows
  const [customCert,   setCustomCert]   = useState('')       // typed when "Custom" chosen
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrLoading,   setOcrLoading]   = useState(false)
  const [expiryDate,   setExpiryDate]   = useState('')
  const [userId,       setUserId]       = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const isCustom = selectValue === '__custom__'

  // Resolved cert type to store
  const certType = isCustom ? customCert.trim() : selectValue

  useEffect(() => {
    supabase.from('workers').select('id, name').order('name').then(({ data }) => {
      if (data) setWorkers(data)
    })
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  // ── OCR ─────────────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExpiryDate('')
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setOcrLoading(true)
    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data: { text } } = await Tesseract.recognize(file, 'eng')
      setExpiryDate(toInputDate(extractExpiryDate(text)))
    } catch {
      setError('OCR scan failed. Please enter the expiry date manually.')
    } finally {
      setOcrLoading(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId)   { setError('Please select a worker.');                    return }
    if (!certType)   { setError('Please select or enter a certificate type.'); return }
    if (!expiryDate) { setError('Please enter an expiry date.');               return }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: sbError } = await supabase.from('certificates').insert([{
      worker_id: workerId,
      certificate_type: certType,
      expiry_date: expiryDate,
      user_id: userId,
    }])

    setSaving(false)

    if (sbError) {
      setError(sbError.message)
    } else {
      setSuccess(true)
      setWorkerId('')
      setSelectValue('')
      setCustomCert('')
      setImagePreview(null)
      setExpiryDate('')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
          <p className="text-sm text-gray-500 mt-1">Upload a certificate photo and we&apos;ll scan it automatically</p>
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

            {/* Worker */}
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

              {/* Custom name input — shown only when "Custom certificate" is selected */}
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

            {/* Certificate photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate Photo</label>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Certificate preview" className="h-full w-full object-contain rounded-lg p-1" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm">Click to upload a photo</span>
                    <span className="text-xs">JPG, PNG, WEBP</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* Expiry date */}
            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1.5">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  disabled={ocrLoading}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition disabled:opacity-60"
                />
                {ocrLoading && (
                  <div className="absolute inset-y-0 right-3 flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Scanning...
                  </div>
                )}
              </div>
              {expiryDate && !ocrLoading && (
                <p className="text-xs text-gray-400 mt-1">Extracted by OCR. Correct if needed.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || ocrLoading}
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
