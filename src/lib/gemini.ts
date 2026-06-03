const MODEL = 'gemini-2.0-flash'
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_URL = `${BASE_URL}/${MODEL}:streamGenerateContent`

export interface GeminiContext {
  mode: string
  voiceRules: string
  bannedHabits: string
  bodySample: string
  title: string
}

function buildSystemPrompt(ctx: GeminiContext): string {
  return [
    `You are a writing assistant for a ${ctx.mode} piece titled "${ctx.title}".`,
    `Voice rules: ${ctx.voiceRules.slice(0, 400)}`,
    `Never use these phrases: ${ctx.bannedHabits.slice(0, 200)}`,
    `Match the voice in this sample: "${ctx.bodySample.slice(0, 500)}"`,
  ].join('\n')
}

export async function* streamGemini(
  apiKey: string,
  ctx: GeminiContext,
  userPrompt: string,
  maxTokens = 400,
): AsyncGenerator<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
    }),
  })

  if (res.status === 400 || res.status === 401 || res.status === 403) throw new Error('INVALID_KEY')
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (!json || json === '[DONE]') continue
      try {
        const chunk = JSON.parse(json)
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) yield text
      } catch { /* skip malformed chunks */ }
    }
  }
}

export function loadGeminiKey(): string {
  return localStorage.getItem('cce_gemini_key') ?? ''
}

export function saveGeminiKey(key: string): void {
  localStorage.setItem('cce_gemini_key', key)
}

export async function validateGeminiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
