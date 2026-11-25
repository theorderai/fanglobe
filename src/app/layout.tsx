import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.fanglobe.live'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'FanGlobe — The fans’ VAR',
  description: 'Was that the right call? Rule on every big refereeing decision live, and see what neutral fans really think.',
  openGraph: {
    title: 'FanGlobe — The fans’ VAR',
    description: 'Live fan verdicts on every big refereeing decision.',
    url: APP_URL, siteName: 'FanGlobe', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'FanGlobe — The fans’ VAR' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#05080d' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
