'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { CityData, FanGlobeEvent } from '@/types'

interface GlobePoint {
  lat: number; lng: number; size: number; color: string; label?: string
  city?: string; count?: number; flag?: string; homeCount?: number; awayCount?: number
}
interface GlobeProps {
  match: FanGlobeEvent
  cities: CityData[]
  userPin: { lat: number; lng: number; color?: string } | null
  newCheckinPos: { lat: number; lng: number } | null
  onCityClick?: (city: CityData) => void
  momentWave?: boolean
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type G = any

export default function GlobeComponent({ match, cities, userPin, newCheckinPos, onCityClick, momentWave }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<G>(null)
  const pointsRef = useRef<GlobePoint[]>([])
  const ringsRef = useRef<unknown[]>([])
  const mountedRef = useRef(false)
  const [waveActive, setWaveActive] = useState(false)

  const arcColor = match.sport?.arcColor ?? 'rgba(57,255,118,'
  const atmosphereColor = match.sport?.atmosphereColor ?? 'rgba(57,255,118,0.65)'
  const homeColor = match.homeColor ?? arcColor + '0.9)'
  const awayColor = match.awayColor ?? '#00d4ff'
  const isRivalry = match.isRivalry && Boolean(match.homeColor) && Boolean(match.awayColor)

  const getCityDotColor = useCallback((city: CityData): string => {
    if (!isRivalry) return `${arcColor}0.88)`
    // Color by team allegiance based on homeCount/awayCount if available
    if (city.homeCount !== undefined && city.awayCount !== undefined) {
      return city.homeCount >= city.awayCount ? homeColor : awayColor
    }
    // Fallback: color by country if it matches home/away
    const homeFlag = match.homeFlag
    const awayFlag = match.awayFlag
    if (city.flag === homeFlag) return homeColor
    if (city.flag === awayFlag) return awayColor
    // Mixed — use whichever team has more global fans
    return `${arcColor}0.7)`
  }, [isRivalry, arcColor, homeColor, awayColor, match.homeFlag, match.awayFlag])

  const buildPoints = useCallback((): GlobePoint[] => {
    const pts: GlobePoint[] = cities.map(c => ({
      lat: c.lat, lng: c.lng,
      size: Math.max(0.035, Math.sqrt(c.count) / 140),
      color: getCityDotColor(c),
      label: `${c.flag} ${c.city} · ${c.count.toLocaleString()} fans`,
      city: c.city, count: c.count, flag: c.flag,
    }))
    pts.push({ lat: match.stadLat, lng: match.stadLng, size: 0.26, color: 'rgba(255,209,102,1)', label: `🏟 ${match.venueShort}` })
    if (userPin) pts.push({ lat: userPin.lat, lng: userPin.lng, size: 0.2, color: userPin.color ?? 'rgba(255,255,255,0.95)', label: '📍 You' })
    return pts
  }, [cities, match, userPin, getCityDotColor])

  const buildArcs = useCallback(() => {
    // Only arc from cities with enough fans, cap at 16, sorted by count
    const arcCities = [...cities]
      .sort((a, b) => b.count - a.count)
      .slice(0, 16)
    
    return arcCities.map((c, i) => {
      // Fade opacity by rank — top cities more visible
      const opacity = Math.max(0.15, 0.65 - i * 0.03)
      return {
        startLat: c.lat, startLng: c.lng,
        endLat: match.stadLat, endLng: match.stadLng,
        color: [`${arcColor}${opacity})`, `${arcColor}0.0)`],
      }
    })
  }, [cities, match, arcColor])

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return
    mountedRef.current = true
    const el = containerRef.current
    import('globe.gl').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctor = (mod as any).default ?? mod
      const g: G = Ctor()(el)
      g.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
       .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
       .atmosphereColor(atmosphereColor).atmosphereAltitude(0.16)
      g.controls().autoRotate = true
      g.controls().autoRotateSpeed = 0.28
      g.controls().enableZoom = true
      g.controls().minDistance = 180
      g.controls().maxDistance = 700
      g.width(el.clientWidth).height(el.clientHeight)

      // Click handler for city dots
      g.onPointClick((point: GlobePoint) => {
        if (point.city && onCityClick) {
          const cityData = cities.find(c => c.city === point.city)
          if (cityData) onCityClick(cityData)
        }
      })

      // Hover cursor
      g.onPointHover((point: GlobePoint | null) => {
        el.style.cursor = point?.city ? 'pointer' : 'grab'
      })

      globeRef.current = g
      const pts = buildPoints(); pointsRef.current = pts
      g.pointsData(pts).pointLat('lat').pointLng('lng').pointColor('color')
       .pointAltitude((d: GlobePoint) => d.size * 0.4).pointRadius((d: GlobePoint) => d.size).pointLabel('label')
       .arcsData(buildArcs()).arcStartLat('startLat').arcStartLng('startLng')
       .arcEndLat('endLat').arcEndLng('endLng').arcColor('color')
       .arcStroke(0.35)
       .arcDashLength(0.4)
       .arcDashGap(0.6)
       .arcDashAnimateTime(3200)
       .arcAltitude(0.12)
       // Rings layer for moment waves
       .ringsData([]).ringLat('lat').ringLng('lng').ringColor('color')
       .ringMaxRadius('maxR').ringPropagationSpeed('speed').ringRepeatPeriod('period')
      g.pointOfView({ lat: match.camLat, lng: match.camLng, altitude: match.camAlt }, 0)
    })
    const resize = () => { if (globeRef.current) globeRef.current.width(el.clientWidth).height(el.clientHeight) }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update match
  useEffect(() => {
    const g = globeRef.current; if (!g) return
    g.atmosphereColor(atmosphereColor)
    g.arcsData(buildArcs())
    const pts = buildPoints(); pointsRef.current = pts; g.pointsData(pts)
    g.pointOfView({ lat: match.camLat, lng: match.camLng, altitude: match.camAlt }, 1100)
  }, [match, buildPoints, buildArcs, atmosphereColor])

  // New checkin flash
  useEffect(() => {
    const g = globeRef.current; if (!g || !newCheckinPos) return
    const jitter = () => (Math.random() - 0.5) * 2.4
    const fp: GlobePoint = { lat: newCheckinPos.lat + jitter(), lng: newCheckinPos.lng + jitter(), size: 0.11, color: `${arcColor}1)` }
    const updated = [...pointsRef.current, fp]; pointsRef.current = updated; g.pointsData(updated)
    setTimeout(() => { pointsRef.current = pointsRef.current.filter(p => p !== fp); g.pointsData(pointsRef.current) }, 4000)
  }, [newCheckinPos, arcColor])

  // User pin
  useEffect(() => {
    const g = globeRef.current; if (!g || !userPin) return
    const pts = buildPoints(); pointsRef.current = pts; g.pointsData(pts)
    g.pointOfView({ lat: userPin.lat, lng: userPin.lng, altitude: 1.4 }, 1400)
  }, [userPin, buildPoints])

  // MOMENT WAVE — rings radiate from all city dots
  useEffect(() => {
    const g = globeRef.current; if (!g || !momentWave) return
    setWaveActive(true)
    const waveColor = arcColor + '0.8)'
    const rings = cities.slice(0, 30).map(c => ({
      lat: c.lat, lng: c.lng,
      color: () => waveColor,
      maxR: 4 + Math.random() * 3,
      speed: 1.5 + Math.random(),
      period: 500 + Math.random() * 500,
    }))
    ringsRef.current = rings
    g.ringsData(rings)
    const timeout = setTimeout(() => {
      g.ringsData([])
      ringsRef.current = []
      setWaveActive(false)
    }, 3500)
    return () => clearTimeout(timeout)
  }, [momentWave, cities, arcColor])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {waveActive && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: arcColor + '1)',
            fontFamily: "'Syne', sans-serif",
            textShadow: `0 0 40px ${arcColor}0.8)`,
            animation: 'momentPop 3s ease forwards',
          }}>
            {match.sport?.vibes.find(v => v.key === 'moment')?.emoji ?? '⚡'}
          </div>
        </div>
      )}
      <style>{`
        @keyframes momentPop {
          0% { opacity: 0; transform: scale(0.5); }
          15% { opacity: 1; transform: scale(1.3); }
          30% { transform: scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: scale(0.8) translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
