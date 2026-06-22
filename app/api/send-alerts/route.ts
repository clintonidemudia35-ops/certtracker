import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

// ─── Clients ──────────────────────────────────────────────────────────────────

// Service role client — bypasses RLS to read all users' data (never exposed to browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } },
  }
)

const twilioClient = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Normalise a stored phone number to WhatsApp E.164 format.
// Accepts: UK 07xxx, international 44xxx, or any number starting with +.
function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('07') && digits.length === 11) return `whatsapp:+44${digits.slice(1)}`
  if (digits.startsWith('44') && digits.length >= 12)  return `whatsapp:+${digits}`
  if (phone.trim().startsWith('+'))                    return `whatsapp:+${digits}`
  return null
}

// Alert thresholds in days (most urgent first — determines which threshold fires on a given run).
const THRESHOLDS = [7, 30, 60] as const
type Threshold = typeof THRESHOLDS[number]

// Return the single threshold this cert qualifies for today, or null if none.
// Each cert matches at most one threshold per run, so alerts don't stack.
function getThreshold(daysUntil: number): Threshold | null {
  if (daysUntil >= 0 && daysUntil <= 7)  return 7
  if (daysUntil > 7  && daysUntil <= 30) return 30
  if (daysUntil > 30 && daysUntil <= 60) return 60
  return null
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {

  // ── CRON_SECRET guard — reject unauthorised callers ──────────────────────
  const cronSecret = process.env.CRON_SECRET
  const provided =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    request.nextUrl.searchParams.get('secret')

  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Env check (logged once per cold start to help diagnose missing vars) ──
  console.log('[send-alerts] env check:', {
    SUPABASE_URL:           !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE:  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    TWILIO_ACCOUNT_SID:     !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY:         !!process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET:      !!process.env.TWILIO_API_SECRET,
    TWILIO_FROM:            !!process.env.TWILIO_WHATSAPP_FROM,
    CRON_SECRET:            !!process.env.CRON_SECRET,
  })

  try {
    // Use UTC midnight so date arithmetic is timezone-safe on the server
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const in60Days = new Date(today)
    in60Days.setUTCDate(today.getUTCDate() + 60)

    const todayStr    = today.toISOString().split('T')[0]
    const in60DaysStr = in60Days.toISOString().split('T')[0]

    // ── 1. Fetch all certificates expiring within the next 60 days ──────────
    const { data: certs, error: certsError } = await supabase
      .from('certificates')
      .select('id, certificate_type, expiry_date, user_id, workers(name)')
      .gte('expiry_date', todayStr)
      .lte('expiry_date', in60DaysStr)
      .order('expiry_date')

    if (certsError) {
      console.error('[send-alerts] cert query failed:', certsError)
      return NextResponse.json({ error: certsError.message }, { status: 500 })
    }

    console.log(`[send-alerts] ${certs?.length ?? 0} certificate(s) expiring in the next 60 days`)

    if (!certs || certs.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: 'No certificates expiring within 60 days.' })
    }

    // ── 2. Fetch alerts already sent for these certificates ─────────────────
    const certIds = certs.map(c => c.id)

    const { data: sentRows, error: sentError } = await supabase
      .from('alerts_sent')
      .select('certificate_id, threshold')
      .in('certificate_id', certIds)

    if (sentError) {
      console.error('[send-alerts] alerts_sent query failed:', sentError)
      return NextResponse.json({ error: sentError.message }, { status: 500 })
    }

    // O(1) lookup: "certId|threshold" → already sent
    const alreadySent = new Set(
      (sentRows ?? []).map(r => `${r.certificate_id}|${r.threshold}`)
    )

    // ── 3. Fetch manager phone numbers for all unique user_ids ───────────────
    const userIds = [...new Set(certs.map(c => c.user_id).filter(Boolean))]

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, phone')
      .in('id', userIds)

    if (profilesError) {
      console.error('[send-alerts] profiles query failed:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Map user_id → manager phone (only users who have saved a number)
    const phoneByUser = new Map(
      (profiles ?? [])
        .filter(p => p.phone)
        .map(p => [p.id, p.phone as string])
    )

    // ── 4. Process each certificate ──────────────────────────────────────────
    let sent    = 0
    let skipped = 0
    const errors: string[] = []

    for (const cert of certs) {
      // Calculate whole days until expiry using UTC to avoid DST drift
      const [y, m, d] = cert.expiry_date.split('-').map(Number)
      const expiry    = new Date(Date.UTC(y, m - 1, d))
      const msPerDay  = 1000 * 60 * 60 * 24
      const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / msPerDay)

      // Which threshold does this cert qualify for today?
      const threshold = getThreshold(daysUntil)
      if (threshold === null) { skipped++; continue }

      // Already sent for this cert + threshold?
      if (alreadySent.has(`${cert.id}|${threshold}`)) {
        skipped++
        continue
      }

      // Manager's phone
      const managerPhone = phoneByUser.get(cert.user_id)
      if (!managerPhone) {
        console.warn(`[send-alerts] skipping cert ${cert.id} — manager (user ${cert.user_id}) has no WhatsApp number saved`)
        skipped++
        continue
      }

      const to = toWhatsAppNumber(managerPhone)
      if (!to) {
        console.warn(`[send-alerts] skipping cert ${cert.id} — could not parse manager phone "${managerPhone}" into E.164`)
        skipped++
        continue
      }

      // Worker name (Supabase may return the relation as object or single-item array)
      const workerRaw  = cert.workers as { name: string } | { name: string }[] | null
      const workerName = (Array.isArray(workerRaw) ? workerRaw[0]?.name : workerRaw?.name) ?? 'Unknown worker'

      const dayLabel = daysUntil === 1 ? '1 day' : `${daysUntil} days`
      const body =
        `CertWith alert: ${workerName}'s ${cert.certificate_type} expires in ${dayLabel} ` +
        `(on ${formatDate(cert.expiry_date)}). Please arrange renewal to stay compliant.`

      console.log(`[send-alerts] sending ${threshold}-day alert for cert ${cert.id} to manager (user ${cert.user_id})`)

      try {
        const msg = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to,
          body,
        })
        console.log(`[send-alerts] sent — Twilio SID: ${msg.sid}`)

        // Record the alert so it is not sent again. ignoreDuplicates handles any race condition.
        await supabase
          .from('alerts_sent')
          .upsert(
            { certificate_id: cert.id, threshold },
            { onConflict: 'certificate_id,threshold', ignoreDuplicates: true }
          )

        sent++
      } catch (err) {
        const e = err as Error & { code?: number; status?: number }
        console.error(`[send-alerts] Twilio error for cert ${cert.id}:`, { message: e.message, code: e.code })
        errors.push(`cert ${cert.id}: ${e.message} (Twilio code ${e.code ?? 'unknown'})`)
        skipped++
      }
    }

    console.log(`[send-alerts] done — sent: ${sent}, skipped: ${skipped}`)

    return NextResponse.json({
      sent,
      skipped,
      total: certs.length,
      ...(errors.length > 0 && { errors }),
    })

  } catch (err) {
    console.error('[send-alerts] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
