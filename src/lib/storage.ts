import type { Article, Codex, CodexOverrides, Snapshot, WritingMode } from '../types'
import { DEFAULT_MODE } from './modes'

const ARTICLES_KEY = 'cce_articles'
const SELECTED_KEY = 'cce_selected'
const CODEX_KEY = 'cce_codex'

export const DEFAULT_CODEX: Codex = {
  voiceRules: 'Write in first person. Use short sentences when making strong points. Never use passive voice to avoid accountability.',
  bannedHabits: 'delve into\nin conclusion\nit is worth noting\nfascinating\nunpack\nnavigate\nit\'s important to\nthe fact that',
  recurringThemes: 'Long-form thinking as resistance. The economics of attention.',
  sourceNotes: '',
  publicationChecklist: '- [ ] Read aloud once\n- [ ] Check opening sentence\n- [ ] Verify all claims sourced\n- [ ] Cut last paragraph and see if it improves\n- [ ] Check subtitle earns its place',
}

export const DEFAULT_ARTICLE: Omit<Article, 'id'> = {
  title: 'The First Draft',
  subtitle: 'Where everything begins and nothing is wasted',
  body: 'Start writing here. This is your private thinking space.\n\nUse the Codex panel on the right to record your voice rules and banned habits. Run a review when you\'re ready to test your draft against editorial standards.\n\nNo one is watching. Write the true version first.',
  outline: '',
  tags: [],
  project: '',
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
    return stored.map(a => ({
      ...a,
      mode: a.mode ?? DEFAULT_MODE,
      outline: (a as any).outline ?? '',
      tags: (a as any).tags ?? [],
      project: (a as any).project ?? '',
    }))
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

export function getMarkdown(article: Article): string {
  const lines: string[] = []
  if (article.title) lines.push(`# ${article.title}`)
  if (article.subtitle) lines.push(`\n*${article.subtitle}*`)
  lines.push('')
  lines.push(article.body)
  return lines.join('\n')
}

const ONBOARDING_KEY = 'cce_onboarded'

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function exportAllData(): void {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    articles: loadArticles(),
    codex: loadCodex(),
    codexOverrides: loadCodexOverrides(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cce-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importAllData(json: string): { articles: Article[]; codex: Codex; codexOverrides: CodexOverrides } {
  const data = JSON.parse(json) as Record<string, unknown>
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file')
  const articles: Article[] = Array.isArray(data.articles)
    ? (data.articles as Array<Omit<Article, 'mode'> & { mode?: WritingMode }>).map(a => ({
        ...a,
        mode: a.mode ?? DEFAULT_MODE,
        outline: (a as Record<string, unknown>).outline as string ?? '',
        tags: (a as Record<string, unknown>).tags as string[] ?? [],
        project: (a as Record<string, unknown>).project as string ?? '',
      }))
    : []
  const codex: Codex = (data.codex && typeof data.codex === 'object')
    ? { ...DEFAULT_CODEX, ...(data.codex as Partial<Codex>) }
    : { ...DEFAULT_CODEX }
  const codexOverrides: CodexOverrides = (data.codexOverrides && typeof data.codexOverrides === 'object')
    ? data.codexOverrides as CodexOverrides
    : {}
  saveArticles(articles)
  saveCodex(codex)
  saveCodexOverrides(codexOverrides)
  return { articles, codex, codexOverrides }
}

const CODEX_OVERRIDES_KEY = 'cce_codex_overrides'
const SNAPSHOTS_KEY = 'cce_snapshots'

export function loadCodexOverrides(): CodexOverrides {
  try {
    const raw = localStorage.getItem(CODEX_OVERRIDES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CodexOverrides
  } catch {
    return {}
  }
}

export function saveCodexOverrides(overrides: CodexOverrides): void {
  localStorage.setItem(CODEX_OVERRIDES_KEY, JSON.stringify(overrides))
}

export function effectiveCodex(base: Codex, overrides: CodexOverrides, mode: WritingMode): Codex {
  const override = overrides[mode]
  if (!override) return base
  return { ...base, ...override }
}

function loadAllSnapshots(): Record<string, Snapshot[]> {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, Snapshot[]>
  } catch {
    return {}
  }
}

export function loadSnapshots(articleId: string): Snapshot[] {
  return loadAllSnapshots()[articleId] ?? []
}

export function saveSnapshot(articleId: string, body: string): Snapshot[] {
  const all = loadAllSnapshots()
  const existing = all[articleId] ?? []
  const updated = [{ ts: Date.now(), body }, ...existing].slice(0, 5)
  all[articleId] = updated
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(all))
  return updated
}

export function exportMarkdown(article: Article): void {
  const md = getMarkdown(article)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'article'}.md`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
