import { useState } from 'react'
import type { Article } from '../types'
import { createArticle } from '../lib/storage'
import { MODES } from '../lib/modes'
import { countWords, relativeTime } from '../lib/utils'

interface Props {
  articles: Article[]
  selectedId: string | null
  onSelect: (id: string) => void
  onUpdate: (articles: Article[]) => void
}

export default function ArticleNavigator({ articles, selectedId, onSelect, onUpdate }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [filter, setFilter] = useState('')

  function handleNew() {
    const article = createArticle({ title: 'Untitled' })
    const updated = [...articles, article]
    onUpdate(updated)
    onSelect(article.id)
    setFilter('')
  }

  function handleDelete(id: string) {
    const target = articles.find(a => a.id === id)
    const label = target?.title?.trim() || 'Untitled'
    if (!window.confirm(`Delete "${label}"?\n\nThis cannot be undone.`)) return
    const updated = articles.filter(a => a.id !== id)
    onUpdate(updated)
    if (selectedId === id) {
      onSelect(updated.length ? updated[updated.length - 1].id : '')
    }
  }

  function startRename(article: Article) {
    setRenamingId(article.id)
    setRenameValue(article.title)
  }

  function commitRename(id: string) {
    const updated = articles.map(a =>
      a.id === id ? { ...a, title: renameValue.trim() || 'Untitled', updatedAt: Date.now() } : a
    )
    onUpdate(updated)
    setRenamingId(null)
  }

  const sorted = [...articles]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(a => !filter || a.title.toLowerCase().includes(filter.toLowerCase()))

  return (
    <aside className="navigator">
      <header className="nav-header">
        <span className="nav-title">Articles</span>
        <button className="btn-new" onClick={handleNew} title="New article" aria-label="New article">
          + New
        </button>
      </header>

      <div className="nav-search-wrap">
        <input
          className="nav-search"
          placeholder="Filter…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter articles"
        />
        {filter && (
          <button
            className="nav-search-clear"
            onClick={() => setFilter('')}
            aria-label="Clear filter"
          >
            ×
          </button>
        )}
      </div>

      <ul className="nav-list">
        {sorted.map(article => (
          <li
            key={article.id}
            className={`nav-item${article.id === selectedId ? ' nav-item--active' : ''}`}
            onClick={() => onSelect(article.id)}
          >
            {renamingId === article.id ? (
              <input
                className="rename-input"
                value={renameValue}
                autoFocus
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => commitRename(article.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(article.id)
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <div className="nav-item-main">
                  <span className="nav-item-title">{article.title || 'Untitled'}</span>
                  <span className={`nav-status nav-status--${article.status}`}>{article.status}</span>
                </div>
                <div className="nav-item-meta">
                  <span>{MODES[article.mode]?.label ?? 'Essay'}</span>
                  <span className="nav-meta-sep">·</span>
                  <span>{countWords(article.body).toLocaleString()}w</span>
                  <span className="nav-meta-sep">·</span>
                  <span>{relativeTime(article.updatedAt)}</span>
                </div>
                <div className="nav-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn-nav-action"
                    title="Rename"
                    aria-label="Rename article"
                    onClick={() => startRename(article)}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-nav-action btn-nav-action--danger"
                    title="Delete article"
                    aria-label="Delete article"
                    onClick={() => handleDelete(article.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}

        {articles.length === 0 && (
          <li className="nav-empty">No articles yet. Press + New to begin.</li>
        )}

        {articles.length > 0 && sorted.length === 0 && (
          <li className="nav-empty">No match for "{filter}".</li>
        )}
      </ul>
    </aside>
  )
}
