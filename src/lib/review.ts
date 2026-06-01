import type { Article, Codex, ReviewResult, ReviewScore, WritingMode } from '../types'
import { MODES } from './modes'

// ─── text primitives ──────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getParagraphs(body: string): string[] {
  return body.split(/\n\n+/).filter(s => s.trim())
}

function paragraphWordCounts(body: string): number[] {
  return getParagraphs(body).map(p => countWords(p))
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

function parseBanned(raw: string): string[] {
  return raw.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean)
}

// ─── global banned phrases (Voice Authenticity) ───────────────────────────────

const BANNED_DEFAULT = [
  'delve into', 'in conclusion', 'it is worth noting', 'fascinating',
  'unpack', 'it\'s important to', 'the fact that',
  'dive deep', 'touch base', 'move the needle', 'leverage', 'utilize',
]

// ─── LLM smell phrase list ────────────────────────────────────────────────────

const LLM_PHRASES = [
  'as an ai', 'certainly', 'absolutely', 'great question',
  'let\'s explore', 'comprehensive', 'in summary', 'to summarize',
  'i\'d be happy', 'of course', 'firstly', 'secondly', 'thirdly',
  'lastly', 'furthermore', 'moreover', 'thus,', 'in this article',
  'in this post', 'we will explore', 'we will discuss',
]

// ─── scoring functions ────────────────────────────────────────────────────────

function scoreVoiceAuthenticity(article: Article, codex: Codex): ReviewScore {
  const lower = article.body.toLowerCase()
  const banned = parseBanned(codex.bannedHabits || '')
  const allBanned = [...BANNED_DEFAULT, ...banned]
  const hits = allBanned.filter(phrase => lower.includes(phrase))
  const score = Math.max(0, 100 - hits.length * 18)
  const note = hits.length === 0
    ? 'No flagged phrases detected.'
    : `Flagged: ${hits.slice(0, 3).map(h => `"${h}"`).join(', ')}${hits.length > 3 ? ` +${hits.length - 3} more` : ''}.`
  return { category: 'Voice Authenticity', score, note }
}

function scoreArgumentClarity(article: Article, mode: WritingMode): ReviewScore {
  const words = countWords(article.body)
  const paras = getParagraphs(article.body).length
  const hasTitle = article.title.trim().length > 3
  const hasSubtitle = article.subtitle.trim().length > 3

  // email/linkedin get lenient structure expectations
  const needsStructure = !['email', 'linkedin', 'journal'].includes(mode)

  let score = 50
  if (words > 200) score += 15
  if (words > 600) score += 10
  if (needsStructure && paras >= 3) score += 10
  if (!needsStructure && paras >= 1) score += 10
  if (hasTitle) score += 10
  if (hasSubtitle) score += 5
  score = Math.min(100, score)

  const note = !hasTitle
    ? 'No title. Argument has no anchor.'
    : words < 100
    ? 'Too short to evaluate structure.'
    : needsStructure && paras < 3
    ? 'Too few paragraphs — argument may be underdeveloped.'
    : 'Argument structure looks sufficient.'
  return { category: 'Argument Clarity', score, note }
}

function scoreParagraphRhythm(article: Article, mode: WritingMode): ReviewScore {
  const counts = paragraphWordCounts(article.body)
  const words = countWords(article.body)

  if (words < 80 || counts.length < 2) {
    return {
      category: 'Paragraph Rhythm',
      score: 40,
      note: 'Not enough text to analyse paragraph rhythm.',
    }
  }

  const avg = counts.reduce((a, b) => a + b, 0) / counts.length
  const dev = stdDev(counts)
  const hasShort = counts.some(c => c < 25)
  const hasLong = counts.some(c => c > 60)

  // ideal avg by mode
  const idealAvg: [number, number] =
    mode === 'email' ? [20, 60] :
    mode === 'linkedin' ? [20, 70] :
    mode === 'fiction' ? [30, 100] :
    [40, 110]

  let score = 60
  if (avg >= idealAvg[0] && avg <= idealAvg[1]) score += 15
  else if (avg > idealAvg[1]) score -= 15
  if (dev > 20) score += 15  // good variance = rhythm
  if (hasShort && hasLong) score += 10  // mix of short and long

  // fiction penalises monotone heavily
  if (mode === 'fiction' && dev < 15) score -= 20

  score = Math.max(0, Math.min(100, score))

  const note =
    avg > idealAvg[1]
      ? `Paragraphs average ${Math.round(avg)} words — too dense. Break them up.`
      : dev < 15
      ? 'Uniform paragraph lengths — vary sentence and paragraph size for rhythm.'
      : hasShort && hasLong
      ? `Good rhythm: short and long paragraphs mixed (avg ${Math.round(avg)}w, variance ${Math.round(dev)}).`
      : `Rhythm acceptable (avg ${Math.round(avg)}w).`

  return { category: 'Paragraph Rhythm', score, note }
}

function scoreAntiLLMSmell(article: Article): ReviewScore {
  const lower = article.body.toLowerCase()
  const hits = LLM_PHRASES.filter(p => lower.includes(p))
  const score = Math.max(0, 100 - hits.length * 15)
  const note = hits.length === 0
    ? 'No LLM patterns detected.'
    : `LLM-adjacent phrasing: ${hits.slice(0, 3).map(h => `"${h}"`).join(', ')}${hits.length > 3 ? ` +${hits.length - 3} more` : ''}.`
  return { category: 'Anti-LLM Smell', score, note }
}

function scoreEvidenceDiscipline(article: Article): ReviewScore {
  const body = article.body
  const words = countWords(body)
  const hasQuote = /[""]/.test(body) || body.includes('"')
  const hasSource = /\(\d{4}\)|http|www\.|source:|via:|—\s*\w/.test(body)
  let score = 60
  if (words < 200) {
    score = 45
  } else {
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
    : 'Quotation present but no explicit sources cited.'
  return { category: 'Evidence Discipline', score, note }
}

function scoreTitleQuality(article: Article, mode: WritingMode): ReviewScore {
  const title = article.title.trim()
  const subtitle = article.subtitle.trim()
  const config = MODES[mode]

  const CLICKBAIT = [
    'you won\'t believe', 'shocking', 'secret', 'they don\'t want you',
    'what nobody tells you', 'this one weird', '#1 way', 'the ultimate',
  ]

  let score = 0
  const issues: string[] = []

  // title checks
  if (!title || title.length < 4) {
    issues.push('No title.')
  } else {
    score += 30
    if (title.length >= 10 && title.length <= 80) score += 20
    else if (title.length > 80) issues.push('Title too long.')
    else issues.push('Title very short.')
    if (title !== title.toUpperCase()) score += 10
    const clickbait = CLICKBAIT.find(c => title.toLowerCase().includes(c))
    if (clickbait) issues.push(`Clickbait pattern: "${clickbait}".`)
    else score += 10
  }

  // subtitle checks
  if (config.subtitleExpected) {
    if (!subtitle || subtitle.length < 5) {
      issues.push('Subtitle missing — expected for this mode.')
    } else {
      score += 20
      if (subtitle.length <= 120) score += 10
      else issues.push('Subtitle too long.')
    }
  } else if (subtitle.length > 5) {
    score += 10
  }

  score = Math.min(100, score)

  const note = issues.length === 0
    ? `Title and subtitle look clean.`
    : issues.join(' ')

  return { category: 'Title Quality', score, note }
}

function scoreDraftMaturity(article: Article, mode: WritingMode): ReviewScore {
  const config = MODES[mode]
  const [minWords, maxWords] = config.idealWordRange
  const words = countWords(article.body)
  const paras = getParagraphs(article.body).length
  const hasTitle = article.title.trim().length > 3

  let score = 0
  let note = ''

  // word count vs ideal range
  if (words < minWords * 0.25) {
    score = 15
    note = `Only ${words} words. ${mode} typically needs ${minWords}–${maxWords}.`
  } else if (words < minWords * 0.5) {
    score = 35
    note = `${words} words — early draft. Target: ${minWords}–${maxWords} for ${config.label}.`
  } else if (words < minWords) {
    score = 55
    note = `${words} words — developing. Aim for ${minWords}+ for ${config.label}.`
  } else if (words <= maxWords) {
    score = 80
    note = `${words} words — within the ${config.label} ideal range.`
  } else {
    score = 75
    note = `${words} words — above typical ${config.label} length. Consider editing for density.`
  }

  // structure bonuses
  if (hasTitle) score += 8
  if (paras >= 3) score += 7
  if (article.status === 'review') score += 5
  if (article.status === 'published') score += 10

  score = Math.min(100, score)

  if (score >= 80 && article.status === 'draft') {
    note += ' Ready to move to review.'
  }

  return { category: 'Draft Maturity', score, note }
}

function scoreBannedPhrases(article: Article, codex: Codex, mode: WritingMode): ReviewScore {
  const lower = article.body.toLowerCase()
  const config = MODES[mode]
  const modePhrases = config.bannedPhrases
  const codexPhrases = parseBanned(codex.bannedHabits || '')

  // combine mode-specific + codex; deduplicate
  const combined = [...new Set([...modePhrases, ...codexPhrases])]
  const hits = combined.filter(phrase => lower.includes(phrase))

  const score = Math.max(0, 100 - hits.length * 20)

  const note =
    combined.length === 0
      ? 'No mode-specific phrases configured.'
      : hits.length === 0
      ? `No ${config.label}-specific phrases detected.`
      : `Found: ${hits.slice(0, 3).map(h => `"${h}"`).join(', ')}${hits.length > 3 ? ` +${hits.length - 3} more` : ''}.`

  return { category: 'Banned Phrases', score, note }
}

// ─── mode-aware dispatch ──────────────────────────────────────────────────────

type ScorerMap = Record<string, () => ReviewScore>

export function runReview(article: Article, codex: Codex): ReviewResult {
  const mode: WritingMode = article.mode ?? 'essay'
  const config = MODES[mode]

  const scorers: ScorerMap = {
    'Voice Authenticity': () => scoreVoiceAuthenticity(article, codex),
    'Argument Clarity': () => scoreArgumentClarity(article, mode),
    'Paragraph Rhythm': () => scoreParagraphRhythm(article, mode),
    'Anti-LLM Smell': () => scoreAntiLLMSmell(article),
    'Evidence Discipline': () => scoreEvidenceDiscipline(article),
    'Title Quality': () => scoreTitleQuality(article, mode),
    'Draft Maturity': () => scoreDraftMaturity(article, mode),
    'Banned Phrases': () => scoreBannedPhrases(article, codex, mode),
  }

  const scores = config.reviewCategories
    .filter(c => scorers[c] !== undefined)
    .map(c => scorers[c]())

  const overall = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0

  const summary =
    overall >= 80 ? `Strong ${config.label} draft. Ready for final review.` :
    overall >= 60 ? `Solid foundation. Address the flagged categories.` :
    overall >= 40 ? `Early ${config.label} draft. Keep writing before reviewing.` :
    'Too early to review. Write more.'

  const editorialNote = config.editorialTip

  return { scores, overall, summary, editorialNote }
}
