import type { Article, ArticleStatus } from '../types'
import { exportMarkdown } from '../lib/storage'

interface Props {
  article: Article | null
  onChange: (article: Article) => void
}

const STATUSES: ArticleStatus[] = ['draft', 'review', 'published']

export default function Editor({ article, onChange }: Props) {
  if (!article) {
    return (
      <main className="editor editor--empty">
        <p>No article selected. Create one in the navigator.</p>
      </main>
    )
  }

  function update(patch: Partial<Article>) {
    if (!article) return
    onChange({ ...article, ...patch, updatedAt: Date.now() })
  }

  return (
    <main className="editor">
      <div className="editor-toolbar">
        <div className="editor-status-row">
          <label className="field-label">Status</label>
          <div className="status-buttons">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`btn-status${article.status === s ? ' btn-status--active' : ''}`}
                onClick={() => update({ status: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-export" onClick={() => exportMarkdown(article)}>
          Export MD
        </button>
      </div>

      <input
        className="field-title"
        placeholder="Title"
        value={article.title}
        onChange={e => update({ title: e.target.value })}
      />

      <input
        className="field-subtitle"
        placeholder="Subtitle"
        value={article.subtitle}
        onChange={e => update({ subtitle: e.target.value })}
      />

      <textarea
        className="field-body"
        placeholder="Write here..."
        value={article.body}
        onChange={e => update({ body: e.target.value })}
      />
    </main>
  )
}
