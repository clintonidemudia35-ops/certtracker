'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${extra}`
}

function Spinner({ white = false }: { white?: boolean }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${white ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── State ──────────────────────────────────────────────────────────────────
  const [userId,        setUserId]       = useState<string | null>(null)
  const [email,         setEmail]        = useState('')
  const [avatarUrl,     setAvatarUrl]    = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview]= useState<string | null>(null)
  const [avatarFile,    setAvatarFile]   = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarSuccess, setAvatarSuccess] = useState(false)
  const [avatarError,   setAvatarError]  = useState<string | null>(null)

  const [savedPhone,    setSavedPhone]    = useState('')       // last value confirmed in DB
  const [alertPhone,    setAlertPhone]    = useState('')       // live input value
  const [editingPhone,  setEditingPhone]  = useState(false)   // true = edit form visible
  const [savingPhone,   setSavingPhone]   = useState(false)
  const [phoneError,    setPhoneError]    = useState<string | null>(null)

  const [newPassword,     setNewPassword]    = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw,       setShowNewPw]      = useState(false)
  const [showConfirmPw,   setShowConfirmPw]  = useState(false)
  const [savingPassword,  setSavingPassword] = useState(false)
  const [pwSuccess,       setPwSuccess]      = useState(false)
  const [pwError,         setPwError]        = useState<string | null>(null)

  // ── Delete modal state ─────────────────────────────────────────────────────
  const [showDeleteModal,  setShowDeleteModal]  = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount,  setDeletingAccount]  = useState(false)
  const [deleteError,      setDeleteError]      = useState<string | null>(null)

  // ── Load user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push('/login'); return }
      const uid = data.user.id
      setUserId(uid)
      setEmail(data.user.email ?? '')

      // Load saved WhatsApp number from profiles table (row may not exist for older accounts)
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', uid)
        .single()
      const phone = profile?.phone ?? ''
      setSavedPhone(phone)
      setAlertPhone(phone)
      setEditingPhone(!phone) // start in edit mode only if no number is saved yet

      // Try to get a signed URL — errors if the file doesn't exist (user has no photo yet)
      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(`${uid}/avatar`, 3600)
      if (signedData?.signedUrl) setAvatarUrl(signedData.signedUrl)
    }
    load()
  }, [router])

  // ── Alerts phone handler ───────────────────────────────────────────────────
  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault()
    setPhoneError(null)

    const trimmed = alertPhone.trim()
    if (trimmed) {
      const digits = trimmed.replace(/\D/g, '')
      if (digits.length < 7 || !trimmed.startsWith('+')) {
        setPhoneError('Enter the number in international format starting with +, e.g. +44 7700 900123.')
        return
      }
    }

    setSavingPhone(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, phone: trimmed }, { onConflict: 'id' })
    setSavingPhone(false)

    if (error) {
      setPhoneError(error.message)
    } else {
      setSavedPhone(trimmed)
      setEditingPhone(false)
    }
  }

  // ── Avatar handlers ────────────────────────────────────────────────────────
  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarSuccess(false)
    setAvatarError(null)
  }

  async function handleAvatarUpload() {
    if (!avatarFile || !userId) return
    setUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(false)

    const { error } = await supabase.storage
      .from('avatars')
      .upload(`${userId}/avatar`, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      })

    if (error) {
      setAvatarError(error.message)
      setUploadingAvatar(false)
      return
    }

    const { data: signedData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(`${userId}/avatar`, 3600)

    setAvatarUrl(signedData?.signedUrl ?? null)
    setAvatarPreview(null)
    setAvatarFile(null)
    setUploadingAvatar(false)
    setAvatarSuccess(true)
  }

  function cancelAvatarChange() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Password handler ───────────────────────────────────────────────────────
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    setDeletingAccount(true)
    setDeleteError(null)

    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setDeleteError(body.error ?? 'Something went wrong. Please try again.')
      setDeletingAccount(false)
      return
    }

    // Session is gone — sign out locally then redirect
    await supabase.auth.signOut()
    router.push('/landing')
  }

  // ── Current display photo (preview takes priority over stored url) ─────────
  const displayPhoto = avatarPreview ?? avatarUrl

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Account</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your profile and account settings</p>
        </div>

        {/* ── Profile Photo ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500 mt-0.5">Shown alongside your account</p>
          </div>

          {avatarError  && <ErrorBanner msg={avatarError} />}
          {avatarSuccess && <SuccessBanner msg="Profile photo updated successfully." />}

          <div className="flex items-center gap-5">
            {/* Avatar circle */}
            <div className="relative shrink-0">
              {displayPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPhoto}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-yellow-100 ring-2 ring-gray-200 flex items-center justify-center">
                  <svg className="w-9 h-9 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              {avatarFile ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    {uploadingAvatar && <Spinner />}
                    {uploadingAvatar ? 'Uploading…' : 'Save Photo'}
                  </button>
                  <button
                    onClick={cancelAvatarChange}
                    className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors w-fit"
                >
                  {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
              )}
              <p className="text-xs text-gray-400">JPG, PNG or WEBP. Max 5 MB.</p>
            </div>
          </div>
        </section>

        {/* ── Account Information ─────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Account Information</h3>
            <p className="text-sm text-gray-500 mt-0.5">Your login email address</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              To change your email, contact support.
            </p>
          </div>
        </section>

        {/* ── Alerts ──────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Alerts</h3>
            <p className="text-sm text-gray-500 mt-0.5">Expiry alerts will be sent to this number via WhatsApp.</p>
          </div>

          {phoneError && <ErrorBanner msg={phoneError} />}

          {savedPhone && !editingPhone ? (
            /* ── Display state: number is saved ── */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp number for expiry alerts
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{savedPhone}</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Saved
                </span>
                <button
                  type="button"
                  onClick={() => { setEditingPhone(true); setAlertPhone(savedPhone); setPhoneError(null) }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-3 py-1 rounded-lg transition-colors"
                >
                  Edit number
                </button>
              </div>
            </div>
          ) : (
            /* ── Edit state: no number yet, or user clicked Edit ── */
            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp number for expiry alerts
                </label>
                <input
                  type="tel"
                  value={alertPhone}
                  onChange={e => { setAlertPhone(e.target.value); setPhoneError(null) }}
                  placeholder="+44 7700 900123"
                  className={inputCls()}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Include your country code, e.g. +44 7700 900123 (UK) or +1 555 123 4567 (US).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                >
                  {savingPhone && <Spinner />}
                  {savingPhone ? 'Saving…' : 'Save Number'}
                </button>
                {savedPhone && (
                  <button
                    type="button"
                    onClick={() => { setEditingPhone(false); setAlertPhone(savedPhone); setPhoneError(null) }}
                    className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500 mt-0.5">Choose a new password for your account</p>
          </div>

          {pwError   && <ErrorBanner msg={pwError} />}
          {pwSuccess && <SuccessBanner msg="Password updated successfully." />}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={inputCls('pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  className={inputCls('pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {savingPassword && <Spinner />}
              {savingPassword ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* ── Delete account ───────────────────────────────────────────────── */}
        <section className="bg-red-50 rounded-xl border border-red-100 p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Delete my account</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Permanently deletes your account and all workers, certificates, and data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null) }}
            className="shrink-0 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
          >
            Delete Account
          </button>
        </section>

      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete your account permanently?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will immediately and permanently delete:
                </p>
                <ul className="text-sm text-gray-500 mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>Your profile and login credentials</li>
                  <li>All workers you have added</li>
                  <li>All certificates and expiry records</li>
                  <li>Your profile photo</li>
                </ul>
                <p className="text-sm font-semibold text-gray-800 mt-2">This action cannot be undone.</p>
              </div>
            </div>

            {deleteError && <ErrorBanner msg={deleteError} />}

            {/* Confirm input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {deletingAccount && <Spinner white />}
                {deletingAccount ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
