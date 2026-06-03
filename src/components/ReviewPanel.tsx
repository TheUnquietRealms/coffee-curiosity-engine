import { useEffect, useState } from 'react'
import type { Article, Codex, ReviewResult } from '../types'
import { runReview } from '../lib/review'
import { MODES } from '../lib/modes'

interface Props {
  article: Article | null
  codex: Codex
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

export default function ReviewPanel({ article, codex }: Props) {
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [reviewedMode, setReviewedMode] = useState<string | null>(null)

  // clear stale results when a different article is selected
  useEffect(() => {
    setResult(null)
    setReviewedMode(null)
  }, [article?.id])

  function handleRun() {
    if (!article) return
    const r = runReview(article, codex)
    setResult(r)
    setReviewedMode(article.mode)
  }

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
