import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

// Log which env vars are present at startup — helps diagnose missing credentials
console.log('[send-alerts] env check:', {
  SUPABASE_URL:       !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY:  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY:     !!process.env.TWILIO_API_KEY,
  TWILIO_API_SECRET:  !!process.env.TWILIO_API_SECRET,
  TWILIO_FROM:        !!process.env.TWILIO_WHATSAPP_FROM,
})

// Server-side Supabase client (RLS disabled for MVP)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// API key auth: twilio(apiKey, apiSecret, { accountSid }) — more secure than auth token
const twilioClient = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
)

// Convert UK-style or international phone numbers to WhatsApp E.164 format
function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  // UK mobile: 07xxx xxxxxx → +447xxx xxxxxx
  if (digits.startsWith('07') && digits.length === 11) {
    return `whatsapp:+44${digits.slice(1)}`
  }
  // Already has UK country code: 447...
  if (digits.startsWith('44') && digits.length >= 12) {
    return `whatsapp:+${digits}`
  }
  // International format with leading +
  if (phone.trim().startsWith('+')) {
    return `whatsapp:+${digits}`
  }

  return null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function GET() {
  try {
    const today = new Date()
    const in30Days = new Date()
    in30Days.setDate(today.getDate() + 30)

    const todayStr = today.toISOString().split('T')[0]
    const in30DaysStr = in30Days.toISOString().split('T')[0]

    console.log(`[send-alerts] querying certificates expiring between ${todayStr} and ${in30DaysStr}`)

    // Fetch expiring certificates with worker details via foreign key join
    const { data: certificates, error: dbError } = await supabase
      .from('certificates')
      .select('certificate_type, expiry_date, workers(name, phone)')
      .gte('expiry_date', todayStr)
      .lte('expiry_date', in30DaysStr)
      .order('expiry_date')

    if (dbError) {
      // Log the full Supabase error object — message alone often hides the real cause
      console.error('[send-alerts] Supabase query failed:', {
        message: dbError.message,
        code:    dbError.code,
        details: dbError.details,
        hint:    dbError.hint,
      })
      return NextResponse.json(
        { error: dbError.message, code: dbError.code, hint: dbError.hint },
        { status: 500 }
      )
    }

    console.log(`[send-alerts] found ${certificates?.length ?? 0} expiring certificate(s)`)

    if (!certificates || certificates.length === 0) {
      return NextResponse.json({
        sent: 0,
        skipped: 0,
        message: 'No certificates expiring within 30 days.',
      })
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const cert of certificates) {
      // Supabase types embedded relations as arrays; at runtime a many-to-one join
      // returns a single object, so we normalise both shapes here.
      const workerData = cert.workers as
        | { name: string; phone: string }
        | { name: string; phone: string }[]
        | null
      const worker = Array.isArray(workerData) ? (workerData[0] ?? null) : workerData

      if (!worker?.phone) {
        console.warn(`[send-alerts] skipping cert "${cert.certificate_type}" — worker has no phone number`)
        skipped++
        continue
      }

      const to = toWhatsAppNumber(worker.phone)
      if (!to) {
        console.warn(`[send-alerts] skipping ${worker.name} — could not parse phone "${worker.phone}" into E.164 format`)
        skipped++
        continue
      }

      const body =
        `Hi ${worker.name}, your ${cert.certificate_type} expires on ` +
        `${formatDate(cert.expiry_date)}. Please renew it soon to stay compliant on site.`

      console.log(`[send-alerts] sending to ${worker.name} (${to})`)

      try {
        const msg = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to,
          body,
        })
        console.log(`[send-alerts] sent — Twilio SID: ${msg.sid}`)
        sent++
      } catch (err) {
        // Twilio errors have a `code` and `status` beyond the standard message
        const twilioErr = err as Error & { code?: number; status?: number }
        console.error(`[send-alerts] Twilio error for ${worker.name}:`, {
          message: twilioErr.message,
          code:    twilioErr.code,
          status:  twilioErr.status,
        })
        errors.push(`${worker.name}: ${twilioErr.message} (Twilio code ${twilioErr.code ?? 'unknown'})`)
        skipped++
      }
    }

    console.log(`[send-alerts] done — sent: ${sent}, skipped: ${skipped}`)

    return NextResponse.json({
      sent,
      skipped,
      total: certificates.length,
      ...(errors.length > 0 && { errors }),
    })
  } catch (err) {
    // Catch unexpected throws (e.g. bad env vars, module init failures)
    console.error('[send-alerts] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
