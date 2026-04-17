'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/globe',       label: 'Globe',       icon: '🌍' },
  { href: '/moments',     label: 'Moments',     icon: '✨' },
  { href: '/oracle',      label: 'Oracle',      icon: '🔮' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/fas/weekly',  label: 'FAS Weekly',  icon: '⚡' },
  { href: '/passport',    label: 'Passport',    icon: '🎫' },
]

interface Props {
  /** Optional: highlight a specific section (useful for match/[slug] etc) */
  currentSection?: string
}

export default function SiteHeader({ currentSection }: Props) {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(4,5,10,0.88)', backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        {/* Logo */}
        <Link href="/globe" style={{
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: '#39FF76',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: '0 0 12px rgba(57,255,118,0.44)',
          }}>🌍</div>
          <span style={{
            fontSize: 14, fontWeight: 800, color: '#fff',
            fontFamily: "'Syne', sans-serif",
          }}>fanglobe<span style={{ color: '#39FF76' }}>.live</span></span>
        </Link>

        {/* Nav links — desktop */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 4,
          overflowX: 'auto', scrollbarWidth: 'none',
        }} className="nav-links">
          {NAV.map(item => {
            const active = currentSection === item.href
              || (!currentSection && pathname === item.href)
              || (!currentSection && item.href !== '/globe' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 100,
                textDecoration: 'none', flexShrink: 0,
                transition: 'all 0.15s',
                fontFamily: "'Syne', sans-serif",
                fontSize: 11, fontWeight: 700,
                background: active ? 'rgba(57,255,118,0.12)' : 'transparent',
                color: active ? '#39FF76' : 'rgba(255,255,255,0.45)',
                border: active ? '1px solid rgba(57,255,118,0.3)' : '1px solid transparent',
              }}>
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* CTA — always visible */}
        <Link href="/globe" style={{
          background: '#39FF76', color: '#000',
          fontWeight: 800, fontSize: 11,
          padding: '7px 14px', borderRadius: 100,
          textDecoration: 'none',
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 0 16px rgba(57,255,118,0.3)',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          📍 Drop pin
        </Link>
      </div>

      <style>{`
        .nav-links::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </div>
  )
}
