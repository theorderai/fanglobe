'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/globe',       label: 'Globe',       icon: '🌍' },
  { href: '/moments',     label: 'Moments',     icon: '✨' },
  { href: '/oracle',      label: 'Oracle',      icon: '🔮' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/fas/weekly',  label: 'FAS Weekly',  icon: '⚡' },
  { href: '/passport',    label: 'Passport',    icon: '🎫' },
]

interface Props {
  currentSection?: string
}

export default function SiteHeader({ currentSection }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: '#051D1A',
      borderBottom: '1px solid rgba(57, 255, 118, 0.15)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        {/* Logo */}
        <Link href="/globe" style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: '#39FF76',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, boxShadow: '0 0 16px rgba(57,255,118,0.55)',
          }}>🌍</div>
          <span style={{
            fontSize: 15, fontWeight: 800, color: '#fff',
            fontFamily: "'Syne', sans-serif", letterSpacing: -0.2,
          }}>fanglobe<span style={{ color: '#39FF76' }}>.live</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{
          display: 'flex', alignItems: 'center', gap: 2,
          flex: 1, justifyContent: 'center',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {NAV.map(item => {
            const active = currentSection === item.href
              || (!currentSection && pathname === item.href)
              || (!currentSection && item.href !== '/globe' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 8,
                textDecoration: 'none', flexShrink: 0,
                transition: 'all 0.15s',
                fontFamily: "'Syne', sans-serif",
                fontSize: 12, fontWeight: 700,
                background: active ? '#39FF76' : 'transparent',
                color: active ? '#000' : '#fff',
                letterSpacing: 0.2,
              }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile toggle */}
        <button className="nav-mobile-toggle" onClick={() => setMobileOpen(v => !v)} style={{
          display: 'none',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8, padding: '7px 11px', cursor: 'pointer',
          color: '#fff', fontSize: 15, fontWeight: 700,
        }} aria-label="Menu">
          {mobileOpen ? '✕' : '☰'}
        </button>

        {/* CTA — desktop */}
        <Link href="/globe" className="nav-cta" style={{
          background: '#39FF76', color: '#000',
          fontWeight: 800, fontSize: 12,
          padding: '8px 16px', borderRadius: 100,
          textDecoration: 'none',
          fontFamily: "'Syne', sans-serif",
          boxShadow: '0 0 20px rgba(57,255,118,0.4)',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          📍 Drop pin
        </Link>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu" style={{
          borderTop: '1px solid rgba(57, 255, 118, 0.12)',
          background: '#051D1A',
          padding: '10px 16px 14px',
          display: 'none',
          flexDirection: 'column', gap: 4,
        }}>
          {NAV.map(item => {
            const active = pathname === item.href
              || (item.href !== '/globe' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 8,
                textDecoration: 'none',
                fontFamily: "'Syne', sans-serif",
                fontSize: 14, fontWeight: 700,
                background: active ? '#39FF76' : 'rgba(255,255,255,0.05)',
                color: active ? '#000' : '#fff',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
          <Link href="/globe" onClick={() => setMobileOpen(false)} style={{
            background: '#39FF76', color: '#000',
            fontWeight: 800, fontSize: 13,
            padding: '12px 14px', borderRadius: 10,
            textDecoration: 'none', textAlign: 'center',
            fontFamily: "'Syne', sans-serif",
            marginTop: 6,
          }}>
            📍 Drop your pin
          </Link>
        </div>
      )}

      <style>{`
        .nav-desktop::-webkit-scrollbar { display: none; }
        @media (max-width: 760px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; align-items: center; }
          .nav-mobile-menu { display: flex !important; }
          .nav-cta { display: none !important; }
        }
      `}</style>
    </div>
  )
}