import { useEffect, useMemo, useState } from 'react'
import type { Article, Codex, ReviewResult } from '../types'
import { runReview } from '../lib/review'
import { MODES } from '../lib/modes'
import { readabilityStats } from '../lib/utils'

interface Props {
  article: Article | null
  codex: Codex
  autoRunTrigger?: number
}

function scoreColor(score: number): string {
  return score >= 75 ? '#16A34A' : score >= 50 ? '#B45309' : '#DC2626'
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="score-bar-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
      <div className="score-bar-fill" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
    </div>
  )
}

function fleschColor(ease: number): string {
  return ease >= 60 ? '#16A34A' : ease >= 40 ? '#B45309' : '#DC2626'
}

export default function ReviewPanel({ article, codex, autoRunTrigger }: Props) {
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [reviewedMode, setReviewedMode] = useState<string | null>(null)

  useEffect(() => {
    setResult(null)
    setReviewedMode(null)
  }, [article?.id])

  useEffect(() => {
    if (!autoRunTrigger || !article) return
    const r = runReview(article, codex)
    setResult(r)
    setReviewedMode(article.mode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunTrigger])

  function handleRun() {
    if (!article) return
    const r = runReview(article, codex)
    setResult(r)
    setReviewedMode(article.mode)
  }

  const stats = useMemo(() => article ? readabilityStats(article.body) : null, [article?.body])

  const currentMode = article?.mode ?? 'essay'
  const modeConfig = MODES[currentMode]
  const modeChanged = result && reviewedMode !== currentMode

  return (
    <section className="review-panel">
      <div className="review-panel-header">
        <h2 className="panel-title">Editorial Review</h2>
        {article && (
          <span className="review-mode-badge">{modeConfig.label}</span>
        )}
      </div>

      {article && (
        <p className="review-editorial-tip">{modeConfig.editorialTip}</p>
      )}

      {stats && stats.sentences > 0 && (
        <div className="analytics-grid">
          <div className="analytics-stat">
            <span className="analytics-value" style={{ color: fleschColor(stats.fleschEase) }}>
              {stats.fleschEase}
            </span>
            <span className="analytics-label">Readability</span>
            <span className="analytics-sub">{stats.fleschLabel}</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-value">{stats.avgSentenceWords}</span>
            <span className="analytics-label">Avg sentence</span>
            <span className="analytics-sub">words</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-value">{stats.sentences}</span>
            <span className="analytics-label">Sentences</span>
            <span className="analytics-sub">{stats.paragraphs} para</span>
          </div>
          <div className="analytics-stat">
            <span
              className="analytics-value"
              style={{ color: stats.passiveCount > 3 ? '#B45309' : 'inherit' }}
            >
              {stats.passiveCount}
            </span>
            <span className="analytics-label">Passive</span>
            <span className="analytics-sub">constructions</span>
          </div>
        </div>
      )}

      <button
        className="btn-review"
        onClick={handleRun}
        disabled={!article}
        aria-label="Run editorial review"
      >
        Run Review
      </button>

      {modeChanged && (
        <p className="review-stale-warning">Mode changed — re-run for updated results.</p>
      )}

      {result && (
        <div className="review-results">
          <div className="review-overall">
            <div className="score-ring-wrap" aria-label={`Overall score ${result.overall}`}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke={scoreColor(result.overall)}
                  strokeWidth="6"
                  strokeDasharray={`${(result.overall / 100) * 163.4} 163.4`}
                  strokeDashoffset="40.85"
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <span className="score-ring-number" style={{ color: scoreColor(result.overall) }}>
                {result.overall}
              </span>
            </div>
            <div className="review-overall-meta">
              <span className="review-overall-label">Overall</span>
              <p className="review-summary">{result.summary}</p>
            </div>
          </div>

          {result.editorialNote && (
            <p className="review-editorial-note">{result.editorialNote}</p>
          )}

          <div className="review-categories">
            {result.scores.map(s => (
              <div key={s.category} className="review-category">
                <div className="review-category-header">
                  <span className="review-category-name">{s.category}</span>
                  <span className="review-category-score">{s.score}</span>
                </div>
                <ScoreBar score={s.score} />
                <p className="review-category-note">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && (
        <p className="review-hint">
          Write your draft, then run a review to get editorial feedback.
        </p>
      )}
    </section>
  )
}
