import { useState } from 'react'
import type { Codex, WritingMode } from '../types'
import { DEFAULT_CODEX } from '../lib/storage'

interface Props {
  defaultCodex: Codex
  onComplete: (codex: Codex, defaultMode: WritingMode) => void
}

const QUICK_MODES: { value: WritingMode; label: string; desc: string }[] = [
  { value: 'essay',        label: 'Essay',         desc: 'Long-form arguments & ideas' },
  { value: 'substack',     label: 'Substack',      desc: 'Newsletter & dispatches' },
  { value: 'linkedin',     label: 'LinkedIn',      desc: 'Professional thought leadership' },
  { value: 'journal',      label: 'Journal',       desc: 'Private reflection' },
  { value: 'blog',         label: 'Blog',          desc: 'Casual public writing' },
  { value: 'technical',    label: 'Technical',     desc: 'Docs & how-tos' },
  { value: 'book-chapter', label: 'Book Chapter',  desc: 'Long-form narrative' },
  { value: 'research',     label: 'Research',      desc: 'Academic & deep dives' },
]

export default function OnboardingModal({ defaultCodex, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [voiceRules, setVoiceRules] = useState(defaultCodex.voiceRules || DEFAULT_CODEX.voiceRules)
  const [bannedHabits, setBannedHabits] = useState(defaultCodex.bannedHabits || DEFAULT_CODEX.bannedHabits)
  const [mode, setMode] = useState<WritingMode>('essay')

  function handleComplete() {
    onComplete({ ...defaultCodex, voiceRules, bannedHabits }, mode)
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">

        {step === 1 && (
          <div className="onboarding-step">
            <div className="onboarding-logo">☕</div>
            <h1 className="onboarding-title">The Writer</h1>
            <p className="onboarding-subtitle">Your private writing studio. No accounts. No sync. Everything stays in your browser.</p>
            <p className="onboarding-body">
              The <strong>Codex</strong> is your writer's identity — voice rules, banned phrases, recurring themes.
              Every AI action reads your Codex first. Your editorial review checks against it.
              Let's set yours up in 2 steps.
            </p>
            <div className="onboarding-actions">
              <button className="btn-onboarding-primary" onClick={() => setStep(2)}>
                Set up my Codex →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">Your Writing Identity</h1>
            <p className="onboarding-subtitle">These rules travel with every AI action and review you run.</p>

            <div className="onboarding-field">
              <label className="field-label">Voice Rules</label>
              <textarea
                className="codex-textarea"
                rows={4}
                value={voiceRules}
                onChange={e => setVoiceRules(e.target.value)}
                placeholder="How you write. Your commitments on the page."
              />
              <p className="onboarding-hint">e.g. Write in first person. Short sentences for strong points. No passive voice.</p>
            </div>

            <div className="onboarding-field">
              <label className="field-label">Banned Habits</label>
              <textarea
                className="codex-textarea"
                rows={4}
                value={bannedHabits}
                onChange={e => setBannedHabits(e.target.value)}
                placeholder="One phrase per line — these will be highlighted as you write."
              />
              <p className="onboarding-hint">One phrase per line. Highlighted in amber as you type.</p>
            </div>

            <div className="onboarding-actions">
              <button className="onboarding-back" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-onboarding-primary" onClick={() => setStep(3)}>
                Choose mode →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">What do you mostly write?</h1>
            <p className="onboarding-subtitle">Sets editorial standards, AI guidance, and review scoring. Change any time in the toolbar.</p>

            <div className="onboarding-mode-grid">
              {QUICK_MODES.map(m => (
                <button
                  key={m.value}
                  className={`onboarding-mode-btn${mode === m.value ? ' onboarding-mode-btn--active' : ''}`}
                  onClick={() => setMode(m.value)}
                >
                  <span className="onboarding-mode-label">{m.label}</span>
                  <span className="onboarding-mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button className="onboarding-back" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-onboarding-primary" onClick={handleComplete}>
                Start writing →
              </button>
            </div>
          </div>
        )}

        <div className="onboarding-steps">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={`onboarding-step-dot${step === n ? ' onboarding-step-dot--active' : step > n ? ' onboarding-step-dot--done' : ''}`}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
