import type { Article, Codex, WritingMode } from '../types'
import { DEFAULT_MODE } from './modes'

const ARTICLES_KEY = 'cce_articles'
const SELECTED_KEY = 'cce_selected'
const CODEX_KEY = 'cce_codex'

export const DEFAULT_CODEX: Codex = {
  voiceRules: 'Write in first person. Use short sentences when making strong points. Never use passive voice to avoid accountability.',
  bannedHabits: 'delve into\nin conclusion\nit is worth noting\nfascinating\nunpack\nnavigate\nit\'s important to\nthe fact that',
  recurringThemes: 'Coffee culture as a lens for society. Long-form thinking as resistance. The economics of attention.',
  sourceNotes: '',
  publicationChecklist: '- [ ] Read aloud once\n- [ ] Check opening sentence\n- [ ] Verify all claims sourced\n- [ ] Cut last paragraph and see if it improves\n- [ ] Check subtitle earns its place',
}

export const DEFAULT_ARTICLE: Omit<Article, 'id'> = {
  title: 'The First Draft',
  subtitle: 'Where everything begins and nothing is wasted',
  body: 'Start writing here. This is your private thinking space.\n\nUse the Codex panel on the right to record your voice rules and banned habits. Run a review when you\'re ready to test your draft against editorial standards.\n\nNo one is watching. Write the true version first.',
  status: 'draft',
  mode: DEFAULT_MODE,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function loadArticles(): Article[] {
  try {
    const raw = localStorage.getItem(ARTICLES_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw) as Array<Omit<Article, 'mode'> & { mode?: WritingMode }>
    return stored.map(a => ({ ...a, mode: a.mode ?? DEFAULT_MODE }))
  } catch {
    return []
  }
}

export function saveArticles(articles: Article[]): void {
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles))
}

export function loadSelectedId(): string | null {
  return localStorage.getItem(SELECTED_KEY)
}

export function saveSelectedId(id: string): void {
  localStorage.setItem(SELECTED_KEY, id)
}

export function loadCodex(): Codex {
  try {
    const raw = localStorage.getItem(CODEX_KEY)
    if (!raw) return { ...DEFAULT_CODEX }
    return JSON.parse(raw) as Codex
  } catch {
    return { ...DEFAULT_CODEX }
  }
}

export function saveCodex(codex: Codex): void {
  localStorage.setItem(CODEX_KEY, JSON.stringify(codex))
}

export function createArticle(partial: Partial<Omit<Article, 'id'>> = {}): Article {
  return {
    ...DEFAULT_ARTICLE,
    ...partial,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function exportMarkdown(article: Article): void {
  const lines: string[] = []
  if (article.title) lines.push(`# ${article.title}`)
  if (article.subtitle) lines.push(`\n*${article.subtitle}*`)
  lines.push('')
  lines.push(article.body)
  const md = lines.join('\n')
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'article'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
