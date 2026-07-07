import { useState, useEffect, useRef, useMemo } from 'react'
import type { Article, ArticleStatus, WritingMode, Codex, Snapshot } from '../types'
import { exportMarkdown, getMarkdown } from '../lib/storage'
import { exportDocx, exportPdf } from '../lib/export'
import { MODE_LIST } from '../lib/modes'
import { TEMPLATES } from '../lib/templates'
import { countWords, relativeTime, readingTime } from '../lib/utils'
import type { SaveStatus } from '../App'
import MarkdownPreview from './MarkdownPreview'

interface Props {
  article: Article | null
  onChange: (article: Article) => void
  saveStatus: SaveStatus
  codex?: Codex
  snapshots?: Snapshot[]
  onSaveSnapshot?: () => void
  onRestoreSnapshot?: (body: string) => void
  onStatusChange?: (status: ArticleStatus) => void
  onToggleNav?: () => void
  onToggleRightPanel?: () => void
  focusMode?: boolean
  onToggleFocus?: () => void
  darkMode?: boolean
  onToggleDark?: () => void
  onGrammarCheck?: () => void
  grammarCooldown?: boolean
  timerSeconds?: number | null
  timerRunning?: boolean
  onToggleTimer?: () => void
  onResetTimer?: () => void
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHighlightHtml(text: string, phrases: string[]): string {
  if (!phrases.length) return escapeHtml(text)
  const pattern = new RegExp(
    `(${phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    parts.push(`<mark class="banned-highlight">${escapeHtml(match[0])}</mark>`)
    lastIndex = match.index + match[0].length
  }
  parts.push(escapeHtml(text.slice(lastIndex)))
  parts.push(' ')
  return parts.join('')
}

const STATUSES: ArticleStatus[] = ['draft', 'review', 'published']

export default function Editor({ article, onChange, saveStatus, codex, snapshots, onSaveSnapshot, onRestoreSnapshot, onStatusChange, onToggleNav, onToggleRightPanel, focusMode, onToggleFocus, darkMode, onToggleDark, onGrammarCheck, grammarCooldown, timerSeconds, timerRunning, onToggleTimer, onResetTimer }: Props) {
  const [copied, setCopied] = useState(false)
  const [settingTarget, setSettingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [outlineOpen, setOutlineOpen] = useState(() => Boolean(article?.outline))
  const [tagInput, setTagInput] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [snapshotsOpen, setSnapshotsOpen] = useState(false)

  useEffect(() => {
    setSettingTarget(false)
    setTargetInput('')
    setOutlineOpen(Boolean(article?.outline))
    setAddingTag(false)
    setTagInput('')
    setPreviewMode(false)
    setSnapshotsOpen(false)
  }, [article?.id])

  useEffect(() => {
    const ta = bodyRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(280, ta.scrollHeight)}px`
  }, [article?.body])

  const bannedPhrases = useMemo(
    () => (codex?.bannedHabits ?? '').split('\n').map(s => s.trim()).filter(Boolean),
    [codex?.bannedHabits]
  )

  const backdropHtml = useMemo(
    () => buildHighlightHtml(article?.body ?? '', bannedPhrases),
    [article?.body, bannedPhrases]
  )

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

  async function handleCopy() {
    const md = getMarkdown(article!)
    try {
      await navigator.clipboard.writeText(md)
    } catch {
      const el = document.createElement('textarea')
      el.value = md
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleSetTarget(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(targetInput, 10)
    if (n > 0) update({ wordTarget: n })
    setSettingTarget(false)
    setTargetInput('')
  }

  function handleAddTag(e: React.FormEvent) {
    e.preventDefault()
    const val = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!val || !article) return
    if (!article.tags.includes(val)) update({ tags: [...article.tags, val] })
    setTagInput('')
    setAddingTag(false)
  }

  function handleRemoveTag(tag: string) {
    if (!article) return
    update({ tags: article.tags.filter(t => t !== tag) })
  }

  const words = countWords(article.body)
  const target = article.wordTarget
  const targetPct = target ? Math.min(100, Math.round((words / target) * 100)) : null
  const targetMet = target ? words >= target : false

  const bodyTextarea = (
    <textarea
      ref={bodyRef}
      className={`field-body${bannedPhrases.length > 0 ? ' field-body--over-backdrop' : ''}`}
      placeholder="Write here…"
      value={article.body}
      onChange={e => update({ body: e.target.value })}
      aria-label="Article body"
      spellCheck
    />
  )

  return (
    <main className="editor">
      <div className="editor-inner">

        <div className="editor-toolbar">
          <div className="toolbar-controls">
            <div className="toolbar-group">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`btn-status btn-status--${s}${article.status === s ? ' btn-status--active' : ''}`}
                  onClick={() => { update({ status: s }); onStatusChange?.(s) }}
                  aria-pressed={article.status === s}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="toolbar-divider" />
            <select
              id="mode-select"
              className="mode-select"
              value={article.mode}
              onChange={e => update({ mode: e.target.value as WritingMode })}
              aria-label="Writing mode"
            >
              {MODE_LIST.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-actions">
            <button
              className="btn-focus btn-mobile-nav"
              onClick={onToggleNav}
              aria-label="Open navigation"
              title="Open navigation"
            >
              ☰
            </button>
            <button
              className="btn-focus btn-mobile-panels"
              onClick={onToggleRightPanel}
              aria-label="Open panels"
              title="Open panels"
            >
              ≡
            </button>
            {saveStatus !== 'idle' && (
              <span className={`save-indicator save-indicator--${saveStatus}`} aria-live="polite">
                {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
              </span>
            )}
            <span className="editor-readtime">{readingTime(article.body)} min</span>
            <span className="editor-wordcount" aria-live="polite">
              {words.toLocaleString()}w
            </span>
            <button
              className="btn-toolbar"
              onClick={onGrammarCheck}
              disabled={grammarCooldown || !article}
              title="Check grammar (LanguageTool, free)"
            >
              Grammar
            </button>
            <button
              className={`btn-toolbar${previewMode ? ' btn-toolbar--accent' : ''}`}
              onClick={() => setPreviewMode(p => !p)}
              title="Toggle preview"
            >
              {previewMode ? 'Write' : 'Preview'}
            </button>
            <button
              className={`btn-toolbar${copied ? ' btn-toolbar--accent' : ''}`}
              onClick={handleCopy}
              aria-label="Copy as markdown"
              title="Copy markdown to clipboard"
            >
              {copied ? 'Copied!' : 'Copy MD'}
            </button>
            <button
              className="btn-toolbar"
              onClick={() => exportMarkdown(article)}
              aria-label="Export as markdown file"
              title="Download as .md file"
            >
              Export
            </button>
            <button
              className="btn-toolbar"
              onClick={() => exportDocx(article)}
              aria-label="Export as Word document"
              title="Download as .docx"
            >
              DOCX
            </button>
            <button
              className="btn-toolbar"
              onClick={() => exportPdf(article)}
              aria-label="Export as PDF"
              title="Download as .pdf"
            >
              PDF
            </button>
            <button
              className="btn-focus"
              onClick={onSaveSnapshot}
              title="Save checkpoint (up to 5 kept)"
              aria-label="Save checkpoint"
            >
              📷
            </button>
            <button
              className="btn-focus"
              onClick={onToggleDark}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀' : '☾'}
            </button>
            <button
              className="btn-focus"
              onClick={onToggleFocus}
              aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
              title={focusMode ? 'Exit focus mode' : 'Focus mode'}
            >
              {focusMode ? '⊠' : '⊡'}
            </button>
            {timerSeconds === null && (
              <button className="btn-focus" onClick={onToggleTimer} title="Start 25-min focus timer">⏱</button>
            )}
          </div>
        </div>

        <div className="outline-section">
          <button
            className="outline-toggle"
            onClick={() => setOutlineOpen(o => !o)}
            aria-expanded={outlineOpen}
          >
            <span className="outline-chevron">{outlineOpen ? '▾' : '▸'}</span>
            Outline / Notes
          </button>
          {outlineOpen && (
            <textarea
              className="outline-body"
              placeholder="Plan your structure here. Excluded from word count and exports."
              value={article.outline}
              onChange={e => update({ outline: e.target.value })}
              rows={4}
            />
          )}
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

        <div className="tag-row">
          {article.tags.map(tag => (
            <span key={tag} className="tag-pill">
              #{tag}
              <button className="tag-pill-remove" onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`}>×</button>
            </span>
          ))}
          {addingTag ? (
            <form className="tag-form" onSubmit={handleAddTag}>
              <input
                className="tag-input"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="tag name"
                autoFocus
                onKeyDown={e => { if (e.key === 'Escape') { setAddingTag(false); setTagInput('') } }}
                onBlur={e => { if (!e.currentTarget.form?.contains(e.relatedTarget as Node)) { setAddingTag(false); setTagInput('') } }}
              />
            </form>
          ) : (
            <button className="tag-add-btn" onClick={() => setAddingTag(true)}>+ tag</button>
          )}
        </div>

        {previewMode
          ? <MarkdownPreview body={article.body} />
          : bannedPhrases.length > 0
            ? (
              <div className="editor-body-wrap">
                <div
                  className="field-body-backdrop"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: backdropHtml }}
                />
                {bodyTextarea}
              </div>
            )
            : bodyTextarea
        }

        {!previewMode && article.body === '' && (
          <button
            className="btn-template"
            onClick={() => update({ body: TEMPLATES[article.mode] })}
          >
            Use {article.mode} template
          </button>
        )}

        {snapshots && snapshots.length > 0 && (
          <div className="snapshots-section">
            <button
              className="snapshots-toggle"
              onClick={() => setSnapshotsOpen(o => !o)}
              aria-expanded={snapshotsOpen}
            >
              <span className="outline-chevron">{snapshotsOpen ? '▾' : '▸'}</span>
              Checkpoints ({snapshots.length})
            </button>
            {snapshotsOpen && (
              <ul className="snapshots-list">
                {snapshots.map((s, i) => (
                  <li key={s.ts} className="snapshot-item">
                    <div className="snapshot-meta">
                      <span className="snapshot-index">#{snapshots.length - i}</span>
                      <span className="snapshot-time">{relativeTime(s.ts)}</span>
                    </div>
                    <span className="snapshot-preview">{s.body.slice(0, 80).replace(/\n/g, ' ')}…</span>
                    <button
                      className="btn-snapshot-restore"
                      onClick={() => {
                        if (window.confirm('Restore this checkpoint? Current body will be overwritten.')) {
                          onRestoreSnapshot?.(s.body)
                        }
                      }}
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="editor-footer">
          <span className="editor-last-edited">
            Last edited {relativeTime(article.updatedAt)}
          </span>

          {timerSeconds !== null && (
            <div className="focus-timer">
              <span className="focus-timer-display">
                {Math.floor((timerSeconds ?? 0) / 60).toString().padStart(2, '0')}:{((timerSeconds ?? 0) % 60).toString().padStart(2, '0')}
              </span>
              <button className="btn-timer-toggle" onClick={onToggleTimer}>{timerRunning ? '⏸' : '▶'}</button>
              <button className="btn-timer-reset" onDoubleClick={onResetTimer} title="Double-click to reset">✕</button>
            </div>
          )}

          <div className="editor-footer-right">
            {target != null ? (
              <div className="word-target">
                <div className="word-target-track">
                  <div
                    className={`word-target-fill${targetMet ? ' word-target-fill--met' : ''}`}
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
                <span className={`word-target-label${targetMet ? ' word-target-label--met' : ''}`}>
                  {words.toLocaleString()} / {target.toLocaleString()}w
                </span>
                <button
                  className="btn-target-clear"
                  onClick={() => update({ wordTarget: undefined })}
                  title="Remove word target"
                  aria-label="Remove word target"
                >
                  ×
                </button>
              </div>
            ) : settingTarget ? (
              <form className="word-target-form" onSubmit={handleSetTarget}>
                <input
                  className="word-target-input"
                  type="number"
                  placeholder="Target…"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  min={1}
                  autoFocus
                  aria-label="Word target"
                />
                <button type="submit" className="btn-target-set">Set</button>
                <button
                  type="button"
                  className="btn-target-cancel"
                  onClick={() => { setSettingTarget(false); setTargetInput('') }}
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                className="btn-set-target"
                onClick={() => setSettingTarget(true)}
                title="Set a word count target"
              >
                Set target
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
