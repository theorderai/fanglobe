import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Haiku tier, as in the original app: moderation is high-volume and simple.
const MODERATION_MODEL = 'claude-haiku-5-5'

export interface ModerationResult { approved: boolean; reason: string | null }

/**
 * Moderate a fan "vent" about a refereeing decision.
 * Anger at decisions is the point of the product; abuse of people is not.
 */
export async function moderateVent(text: string): Promise<ModerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { approved: false, reason: 'moderation unavailable' }

  try {
    const response = await client.messages.create({
      model: MODERATION_MODEL,
      max_tokens: 2000,
      system: `You moderate short fan comments on a live sports app where fans react to referee decisions.

APPROVE: frustration, sarcasm, strong opinions about a DECISION ("that was never a penalty", "VAR is a joke", "worst call of the season"), mild swearing.

REJECT:
- abuse, threats or slurs aimed at any person, including referees, players and other fans
- naming a referee together with an insult, accusation of corruption/cheating, or personal attack
- hate speech, sexual content, doxxing, spam, links, or anything unrelated to the match

Reply with JSON only, no prose: {"approved": true|false, "reason": "<short reason or null>"}`,
      messages: [{ role: 'user', content: text }],
    })

    const block = response.content.find(b => b.type === 'text')
    const raw = block && block.type === 'text' ? block.text : ''
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    const parsed = JSON.parse(json) as { approved?: unknown; reason?: unknown }
    return {
      approved: parsed.approved === true,
      reason: typeof parsed.reason === 'string' ? parsed.reason : null,
    }
  } catch (err) {
    console.error('moderateVent failed:', err)
    // Fail closed: an unmoderated vent never goes public.
    return { approved: false, reason: 'moderation error' }
  }
}
