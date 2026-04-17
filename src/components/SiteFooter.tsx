import Link from 'next/link'

const EXPLORE = [
  { href: '/globe', label: 'Live globe' },
  { href: '/moments', label: 'Clutch moments' },
  { href: '/oracle', label: 'Oracle leaderboard' },
  { href: '/leaderboard', label: 'City leaderboard' },
]

const LEARN = [
  { href: '/fas', label: 'What is FAS?' },
  { href: '/fas/weekly', label: 'FAS Weekly' },
  { href: '/passport', label: 'Fan Passport' },
  { href: '/india-pakistan', label: 'India vs Pakistan' },
]

const MATCHES = [
  { href: '/match/wc26-final', label: 'WC 2026 Final' },
  { href: '/match/mexico-africa-jun-11', label: 'Mexico v Africa' },
  { href: '/match/usa-paraguay-jun-12', label: 'USA v Paraguay' },
  { href: '/match/brazil-morocco-jun-13', label: 'Brazil v Morocco' },
]

export default function SiteFooter() {
  return (
    <footer style={{
      background: '#051D1A',
      borderTop: '1px solid rgba(57, 255, 118, 0.15)',
      marginTop: 40,
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '36px 20px 28px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 28, marginBottom: 28,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, background: '#39FF76',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>🌍</div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>
                fanglobe<span style={{ color: '#39FF76' }}>.live</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 10 }}>
              The live fan tracker for every match that matters.
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              World Cup 2026 · UCL · IPL · The Athletic for vibes.
            </p>
          </div>

          {/* Explore */}
          <FooterCol title="Explore" items={EXPLORE} />
          <FooterCol title="Learn" items={LEARN} />
          <FooterCol title="Top matches" items={MATCHES} />
        </div>

        {/* Bottom row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 20, borderTop: '1px solid rgba(57, 255, 118, 0.08)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            © 2026 · Built for the game
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            <Link href="/fas" style={{ color: 'inherit', textDecoration: 'none' }}>FAS methodology</Link>
            <a href="mailto:hello@fanglobe.live" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, items }: { title: string; items: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#39FF76',
        letterSpacing: 2, textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 12,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(it => (
          <Link key={it.href} href={it.href} style={{
            fontSize: 13, color: 'rgba(255,255,255,0.85)',
            textDecoration: 'none',
            fontFamily: "'Syne', sans-serif",
          }}>
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  )
}