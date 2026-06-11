# CertTracker

A web app for construction companies to track worker certifications and CSCS cards.

## Tech Stack

- **Frontend:** Next.js with TypeScript and Tailwind CSS
- **Backend/Database:** Supabase
- **OCR:** Tesseract.js
- **Alerts:** Twilio (WhatsApp/SMS)
- **Hosting:** Vercel

## MVP Features

1. Upload a photo of a CSCS card or certificate
2. Automatically extract worker name and expiry date using Tesseract.js
3. Store worker profiles and certificates in Supabase
4. Dashboard showing compliant vs expiring workers
5. Automated WhatsApp/SMS alerts 30 days before expiry via Twilio

## Current Progress

### Completed
- Next.js project created with TypeScript and Tailwind
- Supabase installed and connected
- Tesseract.js installed for OCR
- Twilio installed for WhatsApp/SMS alerts
- All packages saved to package.json
- Code pushed to GitHub
- Workers and certificates tables created in Supabase
- RLS disabled for MVP
- Dashboard built with real Supabase data
- Add Worker form connected to Supabase

### Next Steps
1. Build certificate upload page with Tesseract.js OCR
2. Connect certificate data to worker profiles
3. Build expiry alert system with Twilio WhatsApp
4. Deploy to Vercel

## Rules

- Always use TypeScript
- Always use Tailwind for styling
- Keep code simple and well commented
- Ask before making large structural changes
