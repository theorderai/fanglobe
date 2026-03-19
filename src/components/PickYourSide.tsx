'use client'

interface Props {
  event: { homeTeam: string; awayTeam: string; homeFlag: string; awayFlag: string; homeColor?: string; awayColor?: string }
  onPick: (side: 'home' | 'away' | 'neutral') => void
}

export default function PickYourSide({ event, onPick }: Props) {
  const homeColor = event.homeColor ?? '#39ff76'
  const awayColor = event.awayColor ?? '#00d4ff'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      padding: 24, animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
          color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace", marginBottom: 16,
        }}>
          You're on the globe
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8,
          fontFamily: "'Syne', sans-serif", lineHeight: 1.1,
        }}>
          Who are you supporting?
        </h2>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32,
          fontFamily: "'Syne', sans-serif",
        }}>
          Your dot on the globe colors your team
        </p>

        {/* Team buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button onClick={() => onPick('home')} style={{
            flex: 1, background: `${homeColor}18`,
            border: `2px solid ${homeColor}`,
            borderRadius: 14, padding: '18px 12px',
            cursor: 'pointer', transition: 'all 0.18s ease',
            fontFamily: "'Syne', sans-serif",
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{event.homeFlag}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: homeColor }}>{event.homeTeam}</div>
          </button>

          <button onClick={() => onPick('away')} style={{
            flex: 1, background: `${awayColor}18`,
            border: `2px solid ${awayColor}`,
            borderRadius: 14, padding: '18px 12px',
            cursor: 'pointer', transition: 'all 0.18s ease',
            fontFamily: "'Syne', sans-serif",
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{event.awayFlag}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: awayColor }}>{event.awayTeam}</div>
          </button>
        </div>

        <button onClick={() => onPick('neutral')} style={{
          width: '100%', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 100, padding: '11px 0',
          color: 'rgba(255,255,255,0.35)', fontSize: 13,
          cursor: 'pointer', fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
        }}>
          Just watching 👀
        </button>
      </div>
    </div>
  )
}
