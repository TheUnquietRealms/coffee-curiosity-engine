export type ArticleStatus = 'draft' | 'review' | 'published'

export type WritingMode =
  | 'essay' | 'fiction' | 'technical' | 'journal'
  | 'email' | 'linkedin' | 'medium' | 'substack' | 'github-docs'
  | 'poem' | 'book-chapter' | 'research' | 'screenplay' | 'blog'

export interface Article {
  id: string
  title: string
  subtitle: string
  body: string
  outline: string
  tags: string[]
  project: string
  status: ArticleStatus
  mode: WritingMode
  wordTarget?: number
  createdAt: number
  updatedAt: number
}

export interface Codex {
  voiceRules: string
  bannedHabits: string
  recurringThemes: string
  sourceNotes: string
  publicationChecklist: string
}

export interface ReviewScore {
  category: string
  score: number
  note: string
}

export interface ReviewResult {
  scores: ReviewScore[]
  overall: number
  summary: string
  editorialNote: string
}
