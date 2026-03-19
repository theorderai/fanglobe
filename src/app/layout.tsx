import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'kickoff.world — Where Are You Watching?',
  description: 'The live global fan heatmap for FIFA World Cup 2026.',
  openGraph: {
    title: 'kickoff.world — Where Are You Watching?',
    description: 'Millions of fans. One globe. Drop your pin and feel the World Cup pulse.',
    url: 'https://kickoff.world', siteName: 'kickoff.world', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'kickoff.world', description: 'The live fan globe for World Cup 2026.' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
