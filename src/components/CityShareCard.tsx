'use client'
import { useState, useCallback } from 'react'

interface Props {
  city: string
  flag: string
  cityRank: number
  fanCount: number
  matchSlug: string
  homeTeam: string
  awayTeam: string
  accentColor: string
  onClose: () => void
}

export default function CityShareCard({
  city, flag, cityRank, fanCount, matchSlug, homeTeam, awayTeam, accentColor, onClose
}: Props) {
  const [copied, setCopied] = useState(false)

  const rankLabel = cityRank === 1 ? '🥇 #1' : cityRank === 2 ? '🥈 #2' : cityRank === 3 ? '🥉 #3' : `#${cityRank}`
  const rankColor = cityRank === 1 ? '#FFD166' : cityRank === 2 ? '#D4D4D4' : cityRank === 3 ? '#B87333' : accentColor

  const shareUrl = `https://fanglobe.live/leaderboard?match=${matchSlug}&ref=${encodeURIComponent(city)}`
  const shareText = cityRank <= 3
    ? `${flag} ${city} is ${rankLabel} globally for ${homeTeam} vs ${awayTeam}! Drop your pin to help us climb 📍`
    : `${flag} ${city} is ${rankLabel} globally for ${homeTeam} vs ${awayTeam}. Drop your pin to help us break into the top 3 📍`

  const share = useCallback(async () => {
    const data = { title: 'FanGlobe', text: shareText, url: shareUrl }
    if (navigator.share) {
      try { await navigator.share(data) } catch {}
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }, [shareText, shareUrl])

  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')
  const shareX  = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  const shareIM = () => window.open(`sms:&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#0d0d14', border: `1px solid ${rankColor}44`,
        borderRadius: 20, padding: '28px 22px 22px', width: '100%', maxWidth: 380,
        boxShadow: `0 0 80px ${rankColor}22, 0 30px 70px rgba(0,0,0,0.85)`,
        animation: 'popIn 0.3s cubic-bezier(0.16,1.1,0.3,1)',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Preview of the share card */}
        <div style={{
          background: `linear-gradient(135deg, ${rankColor}18 0%, transparent 60%)`,
          border: `1px solid ${rankColor}33`,
          borderRadius: 16,
          padding: '24px 16px 20px',
          textAlign: 'center',
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 20%, ${rankColor}22 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>
              fanglobe.live
            </div>
            <div style={{ fontSize: 56, marginBottom: 4 }}>{flag}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
              {city}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: rankColor, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
              {rankLabel} globally
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              {homeTeam} vs {awayTeam}
            </div>
          </div>
        </div>

        {/* Copy message */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
          {cityRank <= 3
            ? <>Tell your friends {city} is on the leaderboard.<br/>Every pin counts.</>
            : <>Share to rally {city}.<br/>Can we climb to top 3?</>
          }
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={shareWA} style={btnStyle('#25D366', '#fff')}>💬 WhatsApp</button>
          <button onClick={shareX} style={btnStyle('rgba(255,255,255,0.08)', '#fff')}>𝕏 Twitter</button>
          <button onClick={shareIM} style={btnStyle('rgba(255,255,255,0.08)', '#fff')}>📱 iMessage</button>
        </div>
        <button onClick={share} style={{
          width: '100%', background: accentColor, color: '#000',
          border: 'none', borderRadius: 100, padding: '12px 0',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          fontFamily: "'Syne',sans-serif", transition: 'all 0.15s',
          boxShadow: `0 0 20px ${accentColor}44`,
        }}>
          {copied ? '✓ Copied!' : '🔗 Share link'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>
          Sharing gives {city} more visibility on the globe
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    flex: 1, background: bg, color, border: 'none',
    borderRadius: 10, padding: '10px 0',
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Syne',sans-serif",
  }
}
