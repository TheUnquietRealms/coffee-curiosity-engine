import { useState } from 'react'
import type { Article, Codex } from '../types'
import type { GeminiContext } from '../lib/gemini'
import { streamGemini } from '../lib/gemini'

interface Props {
  article: Article | null
  codex: Codex
  geminiKey: string
  onAppendToBody: (text: string) => void
  onSetOutline: (text: string) => void
}

type AIFeature = 'continue' | 'outline' | 'brainstorm' | 'research'

function buildContext(article: Article, codex: Codex): GeminiContext {
  return {
    mode: article.mode,
    voiceRules: codex.voiceRules,
    bannedHabits: codex.bannedHabits,
    bodySample: article.body.slice(0, 500),
    title: article.title,
  }
}

export default function AIPanel({ article, codex, geminiKey, onAppendToBody, onSetOutline }: Props) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [researchTopic, setResearchTopic] = useState('')
  const [cooldown, setCooldown] = useState(false)

  if (!geminiKey) {
    return (
      <section className="ai-panel">
        <h2 className="panel-title">AI Assist</h2>
        <p className="review-hint">Add your Gemini API key in ⚙ Settings to enable AI features.</p>
      </section>
    )
  }

  if (!article) {
    return (
      <section className="ai-panel">
        <h2 className="panel-title">AI Assist</h2>
        <p className="review-hint">Select an article to use AI features.</p>
      </section>
    )
  }

  async function runFeature(feature: AIFeature) {
    if (!article || loading || cooldown) return
    setLoading(true)
    setError(null)
    setOutput('')

    const ctx = buildContext(article, codex)
    const prompts: Record<AIFeature, string> = {
      continue: `Continue writing this ${article.mode}. Match the voice exactly. Output only the continuation (max 300 words). No preamble.`,
      outline: `Generate a structured markdown outline for a ${article.mode} titled "${article.title}". Return only the outline, no explanation.`,
      brainstorm: `Give 5 concrete directions this ${article.mode} titled "${article.title}" could go. One sentence each. Numbered list.`,
      research: `Summarise the topic "${researchTopic}" in approximately 250 words, written in the voice described in the system prompt. No headings, just prose.`,
    }

    let accumulated = ''
    try {
      for await (const chunk of streamGemini(geminiKey, ctx, prompts[feature])) {
        accumulated += chunk
        setOutput(accumulated)
      }
      if (feature === 'outline') {
        onSetOutline(accumulated)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(
        msg === 'INVALID_KEY' ? 'Invalid API key — check Settings.' :
        msg === 'RATE_LIMIT' ? 'Rate limit hit — wait a moment.' :
        msg
      )
    } finally {
      setLoading(false)
      setCooldown(true)
      setTimeout(() => setCooldown(false), 4000)
    }
  }

  const disabled = loading || cooldown

  return (
    <section className="ai-panel">
      <h2 className="panel-title">AI Assist</h2>

      <div className="ai-buttons">
        <button className="btn-ai" disabled={disabled} onClick={() => runFeature('continue')}>
          ✨ Continue writing
        </button>
        <button className="btn-ai" disabled={disabled} onClick={() => runFeature('outline')}>
          📐 Suggest outline
        </button>
        <button className="btn-ai" disabled={disabled} onClick={() => runFeature('brainstorm')}>
          🧠 Brainstorm directions
        </button>
      </div>

      <div className="ai-research">
        <label className="field-label">Research topic</label>
        <div className="ai-research-row">
          <input
            className="ai-research-input"
            placeholder="Enter a topic…"
            value={researchTopic}
            onChange={e => setResearchTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && researchTopic.trim()) runFeature('research') }}
          />
          <button
            className="btn-ai-research"
            disabled={disabled || !researchTopic.trim()}
            onClick={() => runFeature('research')}
          >
            Go
          </button>
        </div>
      </div>

      {error && <p className="ai-error">{error}</p>}
      {loading && <p className="ai-loading">Generating…</p>}

      {output && (
        <div className="ai-output">
          <pre className="ai-output-text">{output}</pre>
          <div className="ai-output-actions">
            <button className="btn-review" onClick={() => onAppendToBody('\n\n' + output)}>
              Append to body
            </button>
            <button className="btn-toolbar" onClick={() => setOutput('')}>
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
