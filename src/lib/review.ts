import type { Article, Codex, ReviewResult, ReviewScore } from '../types'

const BANNED_DEFAULT = [
  'delve into', 'in conclusion', 'it is worth noting', 'fascinating',
  'unpack', 'navigate', 'it\'s important to', 'the fact that',
  'dive deep', 'touch base', 'move the needle', 'leverage', 'utilize',
]

function parseBanned(bannedHabits: string): string[] {
  return bannedHabits
    .split('\n')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function countParagraphs(text: string): number {
  return text.split(/\n\n+/).filter(s => s.trim()).length
}

function avgWordsPerParagraph(body: string): number {
  const paras = body.split(/\n\n+/).filter(s => s.trim())
  if (!paras.length) return 0
  const total = paras.reduce((sum, p) => sum + countWords(p), 0)
  return Math.round(total / paras.length)
}

function scoreVoiceAuthenticity(article: Article, codex: Codex): ReviewScore {
  const lower = article.body.toLowerCase()
  const banned = parseBanned(codex.bannedHabits || '')
  const allBanned = [...BANNED_DEFAULT, ...banned]
  const hits = allBanned.filter(phrase => lower.includes(phrase))
  const score = Math.max(0, 100 - hits.length * 18)
  const note = hits.length === 0
    ? 'No banned phrases detected.'
    : `Banned phrases found: ${hits.slice(0, 3).map(h => `"${h}"`).join(', ')}${hits.length > 3 ? ` +${hits.length - 3} more` : ''}.`
  return { category: 'Voice Authenticity', score, note }
}

function scoreArgumentClarity(article: Article): ReviewScore {
  const words = countWords(article.body)
  const paras = countParagraphs(article.body)
  const hasTitle = article.title.trim().length > 3
  const hasSubtitle = article.subtitle.trim().length > 3
  let score = 50
  if (words > 300) score += 15
  if (words > 800) score += 10
  if (paras >= 3) score += 10
  if (hasTitle) score += 10
  if (hasSubtitle) score += 5
  score = Math.min(100, score)
  const note = !hasTitle
    ? 'No title. Argument has no anchor.'
    : words < 200
    ? 'Too short to evaluate argument structure.'
    : paras < 3
    ? 'Too few paragraphs — argument may be underdeveloped.'
    : 'Argument structure looks sufficient.'
  return { category: 'Argument Clarity', score, note }
}

function scoreHumanPacing(article: Article): ReviewScore {
  const avg = avgWordsPerParagraph(article.body)
  const words = countWords(article.body)
  let score = 70
  if (avg > 120) score -= 20
  if (avg < 20 && words > 100) score -= 10
  if (avg >= 30 && avg <= 90) score += 20
  if (words < 100) score = 40
  score = Math.max(0, Math.min(100, score))
  const note = avg > 120
    ? 'Paragraphs too dense. Break them up.'
    : avg < 20 && words > 100
    ? 'Paragraphs very short — may feel fragmented.'
    : 'Pacing looks human.'
  return { category: 'Human Pacing', score, note }
}

function scoreAntiLLMSmell(article: Article): ReviewScore {
  const lower = article.body.toLowerCase()
  const llmPhrases = [
    'as an ai', 'certainly', 'absolutely', 'great question',
    'let\'s explore', 'comprehensive', 'in summary', 'to summarize',
    'i\'d be happy', 'of course', 'firstly', 'secondly', 'thirdly',
    'lastly', 'in conclusion', 'furthermore', 'moreover', 'thus,',
  ]
  const hits = llmPhrases.filter(p => lower.includes(p))
  const score = Math.max(0, 100 - hits.length * 15)
  const note = hits.length === 0
    ? 'No LLM patterns detected.'
    : `LLM-adjacent phrasing: ${hits.slice(0, 3).map(h => `"${h}"`).join(', ')}.`
  return { category: 'Anti-LLM Smell', score, note }
}

function scoreEvidenceDiscipline(article: Article): ReviewScore {
  const body = article.body
  const words = countWords(body)
  const hasQuote = /[""]/.test(body) || body.includes('"')
  const hasSource = /\(\d{4}\)|http|www\.|source:|via:|—\s*\w/.test(body)
  let score = 60
  if (words < 200) { score = 45 }
  else {
    if (hasQuote) score += 15
    if (hasSource) score += 20
    if (words > 600 && !hasSource) score -= 10
  }
  score = Math.max(0, Math.min(100, score))
  const note = words < 200
    ? 'Draft too short to assess evidence.'
    : !hasQuote && !hasSource
    ? 'No quotes or sources detected. Assertions need grounding.'
    : hasSource
    ? 'Sources or citations present.'
    : 'Some quotation present but no explicit sources.'
  return { category: 'Evidence Discipline', score, note }
}

function scorePublicationReadiness(article: Article): ReviewScore {
  const words = countWords(article.body)
  const hasTitle = article.title.trim().length > 3
  const hasSubtitle = article.subtitle.trim().length > 3
  const hasBody = words > 300
  const isReview = article.status === 'review'
  let score = 0
  if (hasTitle) score += 25
  if (hasSubtitle) score += 15
  if (hasBody) score += 30
  if (words > 600) score += 15
  if (isReview) score += 15
  score = Math.min(100, score)
  const note = !hasTitle
    ? 'Needs a title before publication.'
    : !hasBody
    ? `Only ${words} words — needs more development.`
    : score >= 80
    ? 'Could be ready with final read.'
    : 'Still in development. Continue drafting.'
  return { category: 'Publication Readiness', score, note }
}

export function runReview(article: Article, codex: Codex): ReviewResult {
  const scores: ReviewScore[] = [
    scoreVoiceAuthenticity(article, codex),
    scoreArgumentClarity(article),
    scoreHumanPacing(article),
    scoreAntiLLMSmell(article),
    scoreEvidenceDiscipline(article),
    scorePublicationReadiness(article),
  ]
  const overall = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
  const summary = overall >= 80
    ? 'Strong draft. Ready for final review.'
    : overall >= 60
    ? 'Solid foundation. Address the flagged categories.'
    : overall >= 40
    ? 'Early draft. Keep writing before reviewing.'
    : 'Too early to review. Write more.'
  return { scores, overall, summary }
}
