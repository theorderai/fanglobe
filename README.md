# kickoff.world ⚽🌍

**Where Are You Watching?** — The live global fan heatmap for FIFA World Cup 2026.

WebGL globe · Real-time checkins · Match pulse voting · AI-powered cheers

---

## Stack

| Layer | Service | Why |
|---|---|---|
| Frontend | Next.js 14 + React | App Router, edge rendering |
| Styling | Inline styles + CSS vars | Zero-dependency, globe-native |
| Globe | globe.gl (Three.js) | WebGL, arcs, atmosphere |
| Database | Supabase (Postgres) | Persistence + Realtime WS |
| Cache / counters | Upstash Redis | Atomic counters, write buffer |
| AI cheers | Claude Haiku | Generation + moderation |
| Deployment | Vercel | Edge network, cron jobs |
| CI/CD | GitHub Actions | Type check → deploy |

---

## Local setup

```bash
git clone https://github.com/your-org/kickoff-world
cd kickoff-world
npm install
cp .env.example .env.local
# Fill in all env vars (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

```bash
# Supabase — create project at supabase.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis — create DB at upstash.com (free tier fine for dev)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Anthropic — get key at console.anthropic.com
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any-random-string-for-local
```

---

## Database setup

Run migrations in Supabase SQL Editor:

```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Paste into SQL Editor
cat supabase/migrations/001_schema.sql
```

---

## Architecture at scale

```
Browser
  └─ /api/checkin (Edge fn)
       ├─ Redis INCR [atomic, <1ms]        ← live counter source of truth
       └─ Supabase INSERT [async, non-blocking] ← persistence + analytics

Browser
  └─ /api/snapshot/:matchId (Edge fn, cached 3s)
       ├─ Redis GET snapshot [pre-built by cron]
       └─ fallback: Redis HGETALL + build live

Cron (every 60s, Vercel)
  └─ /api/cron
       ├─ Build snapshot from Redis → cache in Redis (90s TTL)
       ├─ Persist snapshot to Supabase (analytics)
       └─ Generate 2-4 AI cheers per match via Claude Haiku

Supabase Realtime
  └─ cheers table INSERT → broadcast to all clients (new cheer appears in feed)
```

### Scale thresholds

| Users (concurrent) | Action needed |
|---|---|
| 0–500 | Supabase free + Upstash free |
| 500–5K | Supabase Pro ($25/mo) |
| 5K–50K | Upstash Pay-as-you-go |
| 50K–1M | Swap Supabase Realtime → Ably/Pusher |
| 1M+ | Redis cluster + PgBouncer + Cloudflare |

---

## Deployment

### Vercel

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local  # after adding vars in dashboard
vercel deploy --prod
```

Add all env vars in Vercel dashboard → Settings → Environment Variables.

### GitHub Actions secrets needed

```
VERCEL_TOKEN      — from vercel.com/account/tokens
VERCEL_ORG_ID     — from .vercel/project.json after `vercel link`
VERCEL_PROJECT_ID — from .vercel/project.json
```

### Cron auth

Vercel calls `/api/cron` with `Authorization: Bearer {CRON_SECRET}`. Set `CRON_SECRET` to any long random string in Vercel env vars.

---

## Domain

Buy `kickoff.world` → point nameservers to Vercel → add custom domain in Vercel dashboard.

---

## Roadmap

- [ ] SquadCard — AI player card generator
- [ ] Match snapshot share card (html2canvas)
- [ ] Mobile PWA (installable, push notifications at kickoff)
- [ ] Watch party venue pins (monetization layer)
- [ ] City rivalry badges
- [ ] Post-match "Emotional Journey" infographic
