'use client'
import { useState, useEffect } from 'react'

interface Props {
  onDone: () => void
}

const STEPS = [
  {
    emoji: '🌍',
    title: 'The whole world is watching',
    desc: 'Every fan on Earth, in real time. Drop your pin to join the globe and see where everyone is watching from.',
    cta: 'Show me',
  },
  {
    emoji: '⚡',
    title: 'Pick your side',
    desc: 'Choose your team when you drop in. Watch the globe split into colors — your side vs theirs.',
    cta: 'Got it',
  },
  {
    emoji: '🔥',
    title: 'Feel the stadium shake',
    desc: 'React to every goal, wicket, and touchdown. Your pulse hits the globe instantly, seen by millions.',
    cta: "Let's go",
  },
]

export default function OnboardingOverlay({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  const current = STEPS[step]

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setExiting(true)
      setTimeout(() => {
        localStorage.setItem('fg_onboarded', '1')
        onDone()
      }, 350)
    }
  }

  const skip = () => {
    setExiting(true)
    setTimeout(() => {
      localStorage.setItem('fg_onboarded', '1')
      onDone()
    }, 200)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      transition: 'opacity 0.35s ease',
      opacity: exiting ? 0 : 1,
      padding: 24,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 340,
        animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 100,
              background: i === step ? '#39ff76' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{
          fontSize: 64, marginBottom: 24,
          animation: 'bounce 0.5s ease',
          display: 'block',
        }}>
          {current.emoji}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 28, fontWeight: 800, color: '#fff',
          marginBottom: 16, lineHeight: 1.1,
          fontFamily: "'Syne', sans-serif",
          letterSpacing: '-0.5px',
        }}>
          {current.title}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.6, marginBottom: 40,
          fontFamily: "'Syne', sans-serif",
        }}>
          {current.desc}
        </p>

        {/* CTA */}
        <button onClick={next} style={{
          width: '100%', background: '#39ff76', color: '#000',
          border: 'none', borderRadius: 100,
          padding: '15px 0', fontSize: 15, fontWeight: 800,
          fontFamily: "'Syne', sans-serif",
          cursor: 'pointer', letterSpacing: '0.3px',
          boxShadow: '0 0 40px rgba(57,255,118,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          marginBottom: 14,
        }}>
          {current.cta} →
        </button>

        {step < STEPS.length - 1 && (
          <button onClick={skip} style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 13,
            cursor: 'pointer', fontFamily: "'Syne', sans-serif",
          }}>
            Skip
          </button>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
