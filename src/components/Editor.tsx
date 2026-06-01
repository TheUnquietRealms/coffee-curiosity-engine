import type { Article, ArticleStatus, WritingMode } from '../types'
import { exportMarkdown } from '../lib/storage'
import { MODE_LIST } from '../lib/modes'

interface Props {
  article: Article | null
  onChange: (article: Article) => void
}

const STATUSES: ArticleStatus[] = ['draft', 'review', 'published']

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

export default function Editor({ article, onChange }: Props) {
  if (!article) {
    return (
      <main className="editor editor--empty">
        <p>No article selected. Press <strong>+ New</strong> in the navigator to begin.</p>
      </main>
    )
  }

  function update(patch: Partial<Article>) {
    if (!article) return
    onChange({ ...article, ...patch, updatedAt: Date.now() })
  }

  const words = wordCount(article.body)

  return (
    <main className="editor">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <div className="editor-status-row">
            <label className="field-label">Status</label>
            <div className="status-buttons">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`btn-status btn-status--${s}${article.status === s ? ' btn-status--active' : ''}`}
                  onClick={() => update({ status: s })}
                  aria-pressed={article.status === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="editor-mode-row">
            <label className="field-label" htmlFor="mode-select">Mode</label>
            <select
              id="mode-select"
              className="mode-select"
              value={article.mode}
              onChange={e => update({ mode: e.target.value as WritingMode })}
            >
              {MODE_LIST.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="editor-toolbar-right">
          <span className="editor-wordcount" aria-live="polite">
            {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
          </span>
          <button className="btn-export" onClick={() => exportMarkdown(article)}>
            Export MD
          </button>
        </div>
      </div>

      <input
        className="field-title"
        placeholder="Title"
        value={article.title}
        onChange={e => update({ title: e.target.value })}
        aria-label="Article title"
      />

      <input
        className="field-subtitle"
        placeholder="Subtitle"
        value={article.subtitle}
        onChange={e => update({ subtitle: e.target.value })}
        aria-label="Article subtitle"
      />

      <textarea
        className="field-body"
        placeholder="Write here..."
        value={article.body}
        onChange={e => update({ body: e.target.value })}
        aria-label="Article body"
      />
    </main>
  )
}
