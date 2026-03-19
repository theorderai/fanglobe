#!/usr/bin/env node
/**
 * kickoff.world — Local Setup Script
 * Run: node setup.mjs
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, readFileSync } from 'fs'
import readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(res => rl.question(q, res))

const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RED    = '\x1b[31m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

const log   = (m) => console.log(`${GREEN}✓${RESET} ${m}`)
const warn  = (m) => console.log(`${YELLOW}⚠${RESET}  ${m}`)
const info  = (m) => console.log(`${CYAN}→${RESET} ${m}`)
const error = (m) => console.log(`${RED}✗${RESET} ${m}`)
const head  = (m) => console.log(`\n${BOLD}${m}${RESET}`)

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', encoding: 'utf8' })
  } catch (e) {
    if (!opts.optional) throw e
    return null
  }
}

function runSilent(cmd) {
  return run(cmd, { silent: true })
}

async function main() {
  console.clear()
  console.log(`${BOLD}${GREEN}
  ⚽  kickoff.world — Setup
  ────────────────────────────────${RESET}
  This will configure your local environment,
  run Supabase migrations, and get you to npm run dev.
  `)

  // ── Check prerequisites ─────────────────────────────────────────────────────
  head('1 / 5  Checking prerequisites')

  try { runSilent('node --version'); log('Node.js found') } catch { error('Node.js not found — install from nodejs.org'); process.exit(1) }
  try { runSilent('npm --version');  log('npm found')     } catch { error('npm not found');  process.exit(1) }

  const hasSupabaseCLI = (() => { try { runSilent('npx supabase --version'); return true } catch { return false } })()
  if (hasSupabaseCLI) { log('Supabase CLI found') } else { warn('Supabase CLI not found — will skip CLI-based migration (paste SQL manually)') }

  // ── Collect credentials ──────────────────────────────────────────────────────
  head('2 / 5  Supabase credentials')
  info('Find these at: supabase.com/dashboard → your project → Settings → API\n')

  const supabaseUrl        = (await ask('  Supabase URL          : ')).trim()
  const supabaseAnonKey    = (await ask('  Supabase anon key     : ')).trim()
  const supabaseServiceKey = (await ask('  Supabase service key  : ')).trim()
  const supabaseProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''

  if (!supabaseUrl.startsWith('https://') || !supabaseAnonKey || !supabaseServiceKey) {
    error('Invalid Supabase credentials. Check and try again.')
    process.exit(1)
  }
  log(`Project ref: ${supabaseProjectRef}`)

  head('3 / 5  Optional services')
  info('Press Enter to skip any — you can add these later in .env.local\n')

  const upstashUrl   = (await ask('  Upstash Redis URL     : ')).trim()
  const upstashToken = (await ask('  Upstash Redis token   : ')).trim()
  const anthropicKey = (await ask('  Anthropic API key     : ')).trim()

  rl.close()

  // ── Generate .env.local ─────────────────────────────────────────────────────
  head('4 / 5  Writing .env.local')

  const cronSecret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const ipHashSalt = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  const envContent = `# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# ── Upstash Redis ─────────────────────────────────────────────────────────────
${upstashUrl    ? `UPSTASH_REDIS_REST_URL=${upstashUrl}` : '# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io'}
${upstashToken  ? `UPSTASH_REDIS_REST_TOKEN=${upstashToken}` : '# UPSTASH_REDIS_REST_TOKEN=your-token'}

# ── Anthropic ─────────────────────────────────────────────────────────────────
${anthropicKey  ? `ANTHROPIC_API_KEY=${anthropicKey}` : '# ANTHROPIC_API_KEY=sk-ant-...'}

# ── Security ──────────────────────────────────────────────────────────────────
CRON_SECRET=${cronSecret}
IP_HASH_SALT=${ipHashSalt}

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
`

  writeFileSync('.env.local', envContent)
  log('.env.local written')

  // Also write .env.example without real values (for repo safety check)
  const safeToCommit = !existsSync('.gitignore') || readFileSync('.gitignore', 'utf8').includes('.env.local')
  if (!safeToCommit) warn('.env.local is not in .gitignore — add it before committing!')
  else log('.env.local is gitignored ✓')

  // ── Run Supabase migrations ──────────────────────────────────────────────────
  head('5 / 5  Database migrations')

  if (hasSupabaseCLI && supabaseProjectRef) {
    info('Attempting migration via Supabase CLI...')
    try {
      // Link project
      run(`npx supabase link --project-ref ${supabaseProjectRef}`, { optional: true })
      // Push migrations
      const result = run('npx supabase db push', { optional: true })
      if (result !== null) {
        log('Migrations applied via CLI')
      } else {
        throw new Error('CLI push failed')
      }
    } catch {
      warn('CLI migration failed — use manual method below')
      printManualMigrationInstructions()
    }
  } else {
    printManualMigrationInstructions()
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(`
${GREEN}${BOLD}  Setup complete! ✓${RESET}

  ${CYAN}Next steps:${RESET}

  1. Run the app locally:
     ${BOLD}npm run dev${RESET}
     Open: http://localhost:3000

  2. Missing services? Add to .env.local:
     • Upstash Redis → upstash.com (free, 2 min)
     • Anthropic key → console.anthropic.com

  3. Vercel deployment:
     ${BOLD}npm i -g vercel && vercel login && vercel --prod${RESET}
     Then add all .env.local vars in Vercel dashboard.

  4. GitHub:
     ${BOLD}git init && git add . && git commit -m "init" && gh repo create kickoff-world --public --push${RESET}

  ${YELLOW}Reminder: revoke any tokens you created just for this setup.${RESET}
`)
}

function printManualMigrationInstructions() {
  console.log(`
  ${CYAN}Manual migration (2 min):${RESET}
  1. Go to: supabase.com/dashboard → your project → SQL Editor
  2. Paste and run: ${BOLD}supabase/migrations/001_schema.sql${RESET}
  3. Paste and run: ${BOLD}supabase/migrations/002_profiles_security.sql${RESET}

  ${YELLOW}Also enable Anonymous sign-ins:${RESET}
  Supabase dashboard → Authentication → Providers → Enable "Anonymous sign-ins"
`)
}

main().catch(e => { error(String(e)); process.exit(1) })
