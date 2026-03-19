import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function generateCheers(params: {
  matchContext: string; city: string; flag: string; vibe: string; count?: number
}): Promise<string[]> {
  const { matchContext, city, flag, vibe, count = 3 } = params
  const vibeLabel = { fire:'pumped/hyped', ecstatic:'ecstatic/euphoric', nervous:'nervous/anxious', crushed:'devastated', moment:'reacting to a key moment' }[vibe] ?? vibe

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 400,
    messages: [{ role:'user', content: `Generate ${count} short authentic fan cheers for: ${matchContext}
Fan location: ${flag} ${city} · Mood: ${vibeLabel}
Rules: Under 80 chars, casual/raw, no hashtags, some local language ok.
Return ONLY a JSON array of strings.` }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    const parsed = JSON.parse(text.replace(/```json?|```/g, '').trim())
    return Array.isArray(parsed) ? parsed.slice(0, count) : []
  } catch { return [] }
}

export async function moderateCheer(text: string): Promise<{ approved: boolean; reason?: string; cleaned?: string }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 200,
    messages: [{ role:'user', content: `Moderate this fan cheer for a sports app (safe for all ages, non-offensive):
"${text}"
Return ONLY JSON: {"approved":bool,"reason":string|null,"cleaned":string|null}` }],
  })
  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try { return JSON.parse(content.replace(/```json?|```/g, '').trim()) }
  catch { return { approved: false, reason: 'parse error' } }
}
