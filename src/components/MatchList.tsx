import Link from 'next/link'
import type { Match } from '@/types'
import { scoreOrTime } from '@/lib/format'

export default function MatchList({ matches }: { matches: Match[] }) {
  return (
    <div className="card list">
      {matches.map(m => (
        <Link key={m.id} href={`/m/${m.id}`} className="match-row">
          <span className="home">{m.homeTeam}</span>
          <span className="mid">
            {m.status === 'live'
              ? <>{scoreOrTime(m)}{m.minute ? <span className="subtle"> · {m.minute}&apos;</span> : null}</>
              : scoreOrTime(m)}
          </span>
          <span className="away">{m.awayTeam}</span>
        </Link>
      ))}
    </div>
  )
}
