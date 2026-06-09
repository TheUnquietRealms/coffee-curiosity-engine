export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

export function readingTime(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / 220))
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  const stripped = w.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  const groups = stripped.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) ?? []
}

export interface ReadabilityStats {
  sentences: number
  paragraphs: number
  avgSentenceWords: number
  fleschEase: number
  fleschLabel: string
  passiveCount: number
}

export function readabilityStats(text: string): ReadabilityStats {
  const trimmed = text.trim()
  if (!trimmed) return { sentences: 0, paragraphs: 0, avgSentenceWords: 0, fleschEase: 0, fleschLabel: 'N/A', passiveCount: 0 }

  const words = trimmed.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentenceList = splitSentences(trimmed)
  const sentenceCount = Math.max(1, sentenceList.length)
  const paragraphCount = Math.max(1, trimmed.split(/\n\s*\n/).filter(p => p.trim()).length)

  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const avgSentenceWords = Math.round((wordCount / sentenceCount) * 10) / 10
  const fleschEase = Math.max(0, Math.min(100,
    Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount))
  ))

  let fleschLabel: string
  if (fleschEase >= 80) fleschLabel = 'Very Easy'
  else if (fleschEase >= 70) fleschLabel = 'Easy'
  else if (fleschEase >= 60) fleschLabel = 'Standard'
  else if (fleschEase >= 50) fleschLabel = 'Fairly Difficult'
  else if (fleschEase >= 30) fleschLabel = 'Difficult'
  else fleschLabel = 'Very Difficult'

  const passiveMatches = trimmed.match(/\b(is|are|was|were|been|being)\s+\w*(?:ed|en)\b/gi)
  const passiveCount = passiveMatches ? passiveMatches.length : 0

  return { sentences: sentenceCount, paragraphs: paragraphCount, avgSentenceWords, fleschEase, fleschLabel, passiveCount }
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
}
