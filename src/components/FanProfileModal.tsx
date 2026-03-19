'use client'
import { useState } from 'react'
import { POPULAR_TEAMS } from '@/types'
import type { UserProfile } from '@/types'

interface Props {
  onSave: (data: Partial<UserProfile>) => Promise<void>
  onSkip: () => void
  trigger: 'checkin' | 'cheer' | 'vote' // what triggered this
  autoDetectedCountry?: string
  autoDetectedFlag?: string
}

export default function FanProfileModal({ onSave, onSkip, trigger, autoDetectedCountry, autoDetectedFlag }: Props) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [teamFlag, setTeamFlag] = useState('')
  const [email, setEmail] = useState('')
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'identity' | 'email'>('identity')

  const triggerText = {
    checkin: "You're on the map!",
    cheer:   "Your cheer is going live!",
    vote:    "You're in the pulse!",
  }[trigger]

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      display_name: name.trim() || null,
      favourite_team: team || null,
      country: autoDetectedCountry ?? null,
      country_flag: (autoDetectedFlag ?? teamFlag) || null,
      email: email.trim() || null,
      email_updates: emailUpdates,
    })
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(8,10,14,0.97)',
        border: '1px solid rgba(57,255,118,0.2)',
        borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 380,
        boxShadow: '0 0 0 1px rgba(57,255,118,0.05), 0 40px 80px rgba(0,0,0,0.8)',
        fontFamily: "'Syne', sans-serif",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: '#39ff76', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
            {triggerText}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Tell us who's watching 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
            Optional — takes 10 seconds. Your name shows on the live feed.
          </div>
        </div>

        {step === 'identity' && (
          <>
            {/* Display name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 6 }}>
                Your name or nickname
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value.slice(0, 40))}
                placeholder="e.g. Carlos, NYC fan, The Oracle..."
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                  padding: '10px 14px', fontSize: 14, color: '#fff',
                  outline: 'none', fontFamily: "'Syne', sans-serif",
                }}
              />
            </div>

            {/* Team picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 8 }}>
                Supporting
              </label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
                maxHeight: 160, overflowY: 'auto',
              }}>
                {POPULAR_TEAMS.map(t => (
                  <button
                    key={t.name}
                    onClick={() => { setTeam(t.name); setTeamFlag(t.flag) }}
                    title={t.name}
                    style={{
                      background: team === t.name ? 'rgba(57,255,118,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${team === t.name ? 'rgba(57,255,118,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
                      fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.flag}
                  </button>
                ))}
              </div>
              {team && (
                <div style={{ fontSize: 11, color: '#39ff76', marginTop: 6, fontWeight: 600 }}>
                  {teamFlag} Supporting {team}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onSkip}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 100, padding: '11px 0', color: 'rgba(255,255,255,0.35)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif",
                }}
              >
                Skip
              </button>
              <button
                onClick={() => (name.trim() || team) ? setStep('email') : handleSave()}
                style={{
                  flex: 2, background: '#39ff76', border: 'none',
                  borderRadius: 100, padding: '11px 0', color: '#000',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif",
                  boxShadow: '0 0 20px rgba(57,255,118,0.3)',
                }}
              >
                {name.trim() || team ? 'Next →' : "I'm anonymous"}
              </button>
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 6 }}>
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Get match alerts + your World Cup recap"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#fff',
                  outline: 'none', fontFamily: "'Syne', sans-serif",
                }}
              />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  id="email-updates"
                  checked={emailUpdates}
                  onChange={e => setEmailUpdates(e.target.checked)}
                  style={{ marginTop: 2, cursor: 'pointer', accentColor: '#39ff76' }}
                />
                <label htmlFor="email-updates" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, cursor: 'pointer' }}>
                  Send me kickoff alerts + my personal World Cup Wrapped at the end of the tournament
                </label>
              </div>
            </div>

            {/* Privacy note */}
            <div style={{
              background: 'rgba(57,255,118,0.05)', border: '1px solid rgba(57,255,118,0.1)',
              borderRadius: 10, padding: '10px 12px', marginBottom: 16,
              fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5,
            }}>
              No spam, no selling your data. Only match alerts you opt into. Unsubscribe in one click.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep('identity')}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 100, padding: '11px 0', color: 'rgba(255,255,255,0.35)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, background: '#39ff76', border: 'none',
                  borderRadius: 100, padding: '11px 0', color: '#000',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 0 20px rgba(57,255,118,0.3)',
                }}
              >
                {saving ? 'Saving...' : "I'm on the map 🌍"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
