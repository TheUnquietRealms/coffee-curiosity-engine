import { useState } from 'react'
import type { Article, Codex, CodexOverrides, WritingMode } from '../types'
import { MODES } from '../lib/modes'

interface Props {
  codex: Codex
  onChange: (codex: Codex) => void
  currentMode?: WritingMode | null
  overrides: CodexOverrides
  onOverrideChange: (overrides: CodexOverrides) => void
}

interface Field {
  key: keyof Codex
  label: string
  placeholder: string
  rows: number
}

const FIELDS: Field[] = [
  { key: 'voiceRules', label: 'Voice Rules', placeholder: 'How you write. Your commitments on the page.', rows: 4 },
  { key: 'bannedHabits', label: 'Banned AI Habits', placeholder: 'One phrase per line. Highlighted as you type.', rows: 4 },
  { key: 'recurringThemes', label: 'Recurring Themes', placeholder: 'The ideas that keep returning.', rows: 3 },
  { key: 'sourceNotes', label: 'Source Notes', placeholder: 'Books, articles, conversations worth tracking.', rows: 3 },
  { key: 'publicationChecklist', label: 'Publication Checklist', placeholder: '- [ ] Item one\n- [ ] Item two', rows: 5 },
]

const OVERRIDE_FIELDS: Array<{ key: 'voiceRules' | 'bannedHabits'; label: string; placeholder: string; rows: number }> = [
  { key: 'voiceRules', label: 'Voice Rules Override', placeholder: 'Leave blank to inherit global rules.', rows: 3 },
  { key: 'bannedHabits', label: 'Banned Habits Override', placeholder: 'Leave blank to inherit global habits.', rows: 3 },
]

export default function CodexPanel({ codex, onChange, currentMode, overrides, onOverrideChange }: Props) {
  const [overrideOpen, setOverrideOpen] = useState(false)

  function update(key: keyof Codex, value: string) {
    onChange({ ...codex, [key]: value })
  }

  function updateOverride(key: 'voiceRules' | 'bannedHabits', value: string) {
    if (!currentMode) return
    const modeOverride = overrides[currentMode] ?? {}
    const updated = { ...modeOverride, [key]: value }
    // if both fields are empty, remove the override entirely
    const isEmpty = !updated.voiceRules && !updated.bannedHabits
    const newOverrides = { ...overrides }
    if (isEmpty) {
      delete newOverrides[currentMode]
    } else {
      newOverrides[currentMode] = updated
    }
    onOverrideChange(newOverrides)
  }

  const modeOverride = currentMode ? (overrides[currentMode] ?? {}) : {}
  const modeLabel = currentMode ? MODES[currentMode]?.label : null
  const hasOverride = currentMode ? !!overrides[currentMode] : false

  return (
    <section className="codex-panel">
      <h2 className="panel-title">Thinking Codex</h2>
      {FIELDS.map(f => (
        <div key={f.key} className="codex-field">
          <label className="field-label">{f.label}</label>
          <textarea
            className="codex-textarea"
            rows={f.rows}
            placeholder={f.placeholder}
            value={codex[f.key]}
            onChange={e => update(f.key, e.target.value)}
          />
        </div>
      ))}

      {currentMode && (
        <div className="codex-override-section">
          <button
            className="codex-override-toggle"
            onClick={() => setOverrideOpen(o => !o)}
            aria-expanded={overrideOpen}
          >
            <span className="outline-chevron">{overrideOpen ? '▾' : '▸'}</span>
            <span>{modeLabel} Override</span>
            {hasOverride && <span className="codex-override-badge">active</span>}
          </button>

          {overrideOpen && (
            <div className="codex-override-fields">
              <p className="codex-override-hint">
                Override voice rules and banned habits for <strong>{modeLabel}</strong> articles only. Blank = inherit global.
              </p>
              {OVERRIDE_FIELDS.map(f => (
                <div key={f.key} className="codex-field">
                  <label className="field-label">{f.label}</label>
                  <textarea
                    className="codex-textarea"
                    rows={f.rows}
                    placeholder={f.placeholder}
                    value={modeOverride[f.key] ?? ''}
                    onChange={e => updateOverride(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
