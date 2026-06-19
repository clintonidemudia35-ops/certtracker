'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY   = '#1f2a44'
const YELLOW = '#FFD23F'

// ─── Font helpers ─────────────────────────────────────────────────────────────
const heading = { fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans', sans-serif)" }
const body    = { fontFamily: "var(--font-inter, Inter, sans-serif)" }

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: NAVY }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: NAVY }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: NAVY }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    title: 'Add certificates in seconds',
    body:  'Photo or upload a card to auto-fill the worker\'s name and expiry date, or enter them yourself. You are always in control.',
    icon:  <CameraIcon />,
  },
  {
    title: 'Alerts before expiry',
    body:  'Get a WhatsApp alert before any certification lapses, so no worker is ever turned away at the gate.',
    icon:  <BellIcon />,
  },
  {
    title: 'Compliance at a glance',
    body:  'One dashboard shows who is compliant, who is expiring soon, and who needs action today.',
    icon:  <ChartIcon />,
  },
]

const STEPS = [
  { title: 'Add your workers',           body: 'Add your team in seconds.' },
  { title: 'Upload their certificates',  body: 'Photo or upload a certificate to capture the details automatically, then confirm. Or add them manually.' },
  { title: 'Relax',                      body: 'We alert you before anything expires.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {

  // Scroll-reveal for below-fold sections
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={body}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-gray-100"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/certtracker-logo.svg" alt="CertTracker shield" style={{ height: '32px', width: 'auto' }} />
            <span className="text-sm font-bold tracking-tight" style={{ ...heading }}>
              <span style={{ color: NAVY }}>Cert</span><span style={{ color: '#e8a900' }}>Tracker</span>
            </span>
          </div>

          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">

        {/* Left column */}
        <div>
          {/* Badge */}
          <div
            className="anim-hero inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-8"
            style={{
              background: '#1f2a44',
              color: '#FFD23F',
              animationDelay: '0ms',
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Built for construction teams
          </div>

          {/* Headline */}
          <h1
            className="anim-hero text-4xl sm:text-5xl font-extrabold tracking-tight mt-2 mb-8"
            style={{ color: NAVY, animationDelay: '80ms', lineHeight: '1.35', ...heading }}
          >
            Never let a<br />
            certification<br />
            <span style={{ color: '#e8a900' }}>expire</span> again
          </h1>

          {/* Subtext */}
          <p
            className="anim-hero text-lg text-gray-500 leading-relaxed mb-10 max-w-lg"
            style={{ animationDelay: '160ms' }}
          >
            CertTracker tracks your workers&apos; certifications, CSCS, OSHA, White Card and more,
            and sends automatic WhatsApp alerts before they expire. Stay compliant, pass every audit,
            keep your crew on site.
          </p>

          {/* CTAs */}
          <div
            className="anim-hero flex flex-wrap items-center gap-4"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              style={{ background: YELLOW, color: NAVY, ...heading }}
            >
              Get Started Free
              <ArrowRight />
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        {/* Right column: hero animation video */}
        <div
          className="anim-hero w-full h-64 sm:h-80 lg:h-[440px] overflow-hidden rounded-2xl"
          style={{ animationDelay: '120ms', background: 'white' }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full block"
            style={{ objectFit: 'cover', objectPosition: 'left center' }}
          >
            <source src="/hero-animation.mp4" type="video/mp4" />
          </video>
        </div>

      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-gray-100" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">

          {/* Section heading */}
          <div className="reveal text-center mb-14">
            <h2
              className="text-3xl font-bold tracking-tight mb-3"
              style={{ color: NAVY, ...heading }}
            >
              Everything you need to stay compliant
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              From card scanning to automatic alerts. All in one place.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="h-full bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                    style={{ background: YELLOW }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold mb-2"
                      style={{ color: NAVY, ...heading }}
                    >
                      {b.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{b.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Section heading */}
          <div className="reveal text-center mb-16">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: NAVY, ...heading }}
            >
              How it works
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">

            {/* Connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px"
              style={{ background: `linear-gradient(to right, ${YELLOW}, ${YELLOW})`, opacity: 0.4 }}
            />

            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="reveal flex flex-col items-center text-center gap-4"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Number circle */}
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-full text-lg font-bold shrink-0 z-10"
                  style={{ background: NAVY, color: YELLOW, ...heading }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3
                    className="text-base font-bold mb-1.5"
                    style={{ color: NAVY, ...heading }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ── CTA BAND ──────────────────────────────────────────────────────── */}
      <section className="reveal py-24 px-6" style={{ background: NAVY }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: YELLOW, ...heading }}
          >
            Stop chasing expiry dates
          </h2>
          <p className="text-gray-300 text-base mb-10 leading-relaxed">
            Get started free in minutes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: YELLOW, color: NAVY, ...heading }}
          >
            Get Started Free
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certtracker-lockup.svg" alt="CertTracker" style={{ width: '160px', height: 'auto' }} />
          <span className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} CertTracker. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  )
}
