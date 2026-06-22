'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CheckBadgeIcon() {
  return (
    <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',           icon: <HomeIcon /> },
  { label: 'Workers',      href: '/workers/new',         icon: <UsersIcon /> },
  { label: 'Certificates', href: '/certificates/new',    icon: <DocumentIcon /> },
  { label: 'Account',      href: '/dashboard/account',   icon: <UserCircleIcon /> },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()

  const [collapsed,   setCollapsed]   = useState(false)  // desktop icon-only mode
  const [mobileOpen,  setMobileOpen]  = useState(false)  // mobile overlay visible
  const [email,       setEmail]       = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    // Dashboard: exact match or worker detail sub-pages — NOT /dashboard/account
    if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/workers')
    return pathname.startsWith(href)
  }

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const sidebarTranslate = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${sidebarWidth} ${sidebarTranslate}`}
      >

        {/* Brand */}
        <div className={`flex items-center h-16 border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center' : 'gap-3 px-4'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certtracker-logo.svg" alt="CertWith" style={{ height: '32px', width: 'auto' }} className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">CertWith</p>
              <p className="text-xs text-gray-400 leading-tight truncate">Certification Manager</p>
            </div>
          )}
        </div>

        {/* User email */}
        {!collapsed && email && (
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs text-gray-400 truncate" title={email}>{email}</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                  ${active
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <span className={active ? 'text-yellow-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: logout + collapse toggle */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`
              flex items-center gap-3 w-full rounded-lg text-sm font-medium
              text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors
              ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
            `}
          >
            <LogoutIcon />
            {!collapsed && 'Logout'}
          </button>

          {/* Desktop-only collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`
              hidden lg:flex items-center gap-2 w-full rounded-lg text-xs
              text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors
              ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
            `}
          >
            {collapsed ? <ChevronRightIcon /> : <><ChevronLeftIcon /><span>Collapse</span></>}
          </button>
        </div>

      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* Mobile top bar — hidden on desktop */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/certtracker-logo.svg" alt="CertWith" style={{ height: '28px', width: 'auto' }} />
            <span className="text-sm font-bold text-gray-900">CertWith</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

      </div>

    </div>
  )
}
