import Link from 'next/link'

export default function SiteFooter() {
  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.4)',
      padding: '32px 20px 28px',
      marginTop: 60,
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 28, marginBottom: 24,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#fff',
              fontFamily: "'Syne', sans-serif", marginBottom: 8,
            }}>
              fanglobe<span style={{ color: '#39FF76' }}>.live</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Real-time global fan tracking. The first live map of who's watching sports, from where, feeling what.
            </div>
          </div>

          {/* Link groups */}
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <FooterGroup title="Explore" links={[
              { href: '/globe', label: 'Live globe' },
              { href: '/leaderboard', label: 'City leaderboard' },
              { href: '/passport', label: 'Fan passport' },
              { href: '/india-pakistan', label: 'India vs Pakistan' },
            ]} />
            <FooterGroup title="FAS" links={[
              { href: '/fas', label: 'What is FAS?' },
              { href: '/fas/weekly', label: 'Weekly report' },
            ]} />
            <FooterGroup title="Partners" links={[
              { href: '/embed', label: 'Broadcaster embed' },
              { href: 'mailto:nij@fanglobe.live', label: 'Partner with us' },
            ]} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            © 2026 FanGlobe · Built for World Cup 2026
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Made with ⚡ by fans for fans
          </div>
        </div>
      </div>
    </div>
  )
}

function FooterGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
        letterSpacing: '1.5px', textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 10,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            fontSize: 12, color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none', transition: 'color 0.15s',
          }}>{link.label}</Link>
        ))}
      </div>
    </div>
  )
}
