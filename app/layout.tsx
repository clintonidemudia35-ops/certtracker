import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "CertWith",
  description: "Track worker certifications and stay compliant.",
  icons: {
    icon: '/certtracker-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  )
}
