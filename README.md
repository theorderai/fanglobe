# FanGlobe — the fans’ VAR

Live, incident-anchored fan verdicts on refereeing decisions.

When a big call lands (penalty, red card, VAR review), fans rule on it in one or two taps:
**right call / wrong call** plus **how angry** (1–5). Results split by **home fans, away fans and
neutrals**, so the headline is the one that cuts through tribalism:

> *Even 41% of Chelsea fans say the ref got it wrong.*

## How it works

| Piece | Where |
|---|---|
| Pick a side (home / away / neutral), locked per match | `POST /api/side` |
| Rule on a decision (one vote per fan, final) | `POST /api/verdict` |
| “Bad call!” taps → 10-second timeseries → spike detection opens a crowd flashpoint | `POST /api/react`, `src/lib/spike.ts` |
| Short vents, moderated by Claude Haiku (decisions yes, abuse of people no) | `POST /api/vent`, `src/lib/claude.ts` |
| Everything a page or broadcaster needs, CDN-cached for 2s | `GET /api/match/:id` |
| Controversy index + headline logic | `src/lib/verdict.ts` |
| Share pages + 1200×630 verdict cards | `/i/:shortId`, `/api/og/incident/:shortId` |
| Broadcast overlay (OBS / vMix / iframe) | `/widget/:matchId` (`?bg=transparent` for keying) |
| Ref Desk: add matches, open/close decisions by hand | `/admin` (needs `ADMIN_SECRET`) |
| Optional live feed (API-Football): fixtures, score, auto-incidents for reds/pens/VAR | `src/lib/feed.ts`, `GET /api/cron` |

### Controversy index (0–100)

`60% dissent + 25% anger + 15% volume`, where dissent is the share saying “wrong” among
**neutrals** when there are at least 10 of them, otherwise among everyone. Labels:
Fair call < 35 ≤ Debatable < 55 ≤ Controversial < 75 ≤ Robbery. Under 25 votes it shows
“Too early”.

### Data honesty

Every number shown is a real vote. There is no seeded data and no generated fan content.
That is the product’s credibility with broadcasters; keep it that way.

## Stack

Next.js 14 (App Router) · Supabase (Postgres + anonymous auth) · Upstash Redis (live counters,
timeseries, rate limits) · Claude Haiku (moderation) · Vercel (hosting + per-minute cron).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

### Database

Run `supabase/migrations/010_fan_verdict.sql` in the Supabase SQL editor (or `supabase db push`).
It only adds new tables (`matches`, `incidents`, `match_sides`, `verdict_votes`, `vents`,
`reaction_buckets`); World Cup-era tables are left untouched.

Anonymous sign-ins must be enabled in Supabase Auth (they already are for the live site).

### Matchday without a feed

1. Open `/admin`, enter `ADMIN_SECRET`.
2. Add the match, set it to **live** at kickoff.
3. When a big call happens, fill in *what happened* and *the ref’s call*, then **Open verdict**.
   Fans who hit “Bad call!” can also open a crowd flashpoint on their own.

### Matchday with API-Football

Set `API_FOOTBALL_KEY`, `FEED_LEAGUES` and `FEED_SEASON`. The cron syncs fixtures hourly and
polls live matches every minute (about 1,500 requests a day, so a paid plan).
