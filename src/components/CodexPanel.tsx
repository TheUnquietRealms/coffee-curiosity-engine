import type { Codex } from '../types'

interface Props {
  codex: Codex
  onChange: (codex: Codex) => void
}

interface Field {
  key: keyof Codex
  label: string
  placeholder: string
  rows: number
}

const FIELDS: Field[] = [
  { key: 'voiceRules', label: 'Voice Rules', placeholder: 'How you write. Your commitments on the page.', rows: 4 },
  { key: 'bannedHabits', label: 'Banned AI Habits', placeholder: 'One phrase per line. Checked on review.', rows: 4 },
  { key: 'recurringThemes', label: 'Recurring Themes', placeholder: 'The ideas that keep returning.', rows: 3 },
  { key: 'sourceNotes', label: 'Source Notes', placeholder: 'Books, articles, conversations worth tracking.', rows: 3 },
  { key: 'publicationChecklist', label: 'Publication Checklist', placeholder: '- [ ] Item one\n- [ ] Item two', rows: 5 },
]

export default function CodexPanel({ codex, onChange }: Props) {
  function update(key: keyof Codex, value: string) {
    onChange({ ...codex, [key]: value })
  }

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
    </section>
  )
}
