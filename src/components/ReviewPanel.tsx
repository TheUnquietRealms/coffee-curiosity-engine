import { useState } from 'react'
import type { Article, Codex, ReviewResult } from '../types'
import { runReview } from '../lib/review'

interface Props {
  article: Article | null
  codex: Codex
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#5a8a5a' : score >= 50 ? '#8a7a3a' : '#8a3a3a'
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function ReviewPanel({ article, codex }: Props) {
  const [result, setResult] = useState<ReviewResult | null>(null)

  function handleRun() {
    if (!article) return
    setResult(runReview(article, codex))
  }

  return (
    <section className="review-panel">
      <h2 className="panel-title">Editorial Review</h2>

      <button
        className="btn-review"
        onClick={handleRun}
        disabled={!article}
      >
        Run Review
      </button>

      {result && (
        <div className="review-results">
          <div className="review-overall">
            <span className="review-overall-label">Overall</span>
            <span className="review-overall-score">{result.overall}</span>
          </div>
          <ScoreBar score={result.overall} />
          <p className="review-summary">{result.summary}</p>

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
