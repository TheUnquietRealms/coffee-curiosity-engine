import { useState } from 'react'
import { saveGeminiKey, validateGeminiKey } from '../lib/gemini'

interface Props {
  currentKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export default function SettingsPanel({ currentKey, onSave, onClose }: Props) {
  const [keyInput, setKeyInput] = useState(currentKey)
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')

  async function handleSave() {
    if (!keyInput.trim()) {
      saveGeminiKey('')
      onSave('')
      onClose()
      return
    }
    setStatus('validating')
    const valid = await validateGeminiKey(keyInput.trim())
    if (valid) {
      saveGeminiKey(keyInput.trim())
      onSave(keyInput.trim())
      setStatus('valid')
      setTimeout(onClose, 800)
    } else {
      setStatus('invalid')
    }
  }

  return (
    <section className="settings-panel">
      <header className="settings-header">
        <h2 className="panel-title">Settings</h2>
        <button className="btn-settings-close" onClick={onClose} aria-label="Close settings">✕</button>
      </header>

      <div className="settings-field">
        <label className="field-label">Gemini API Key</label>
        <input
          type="password"
          className="settings-input"
          placeholder="AIza..."
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
        />
        <p className="settings-hint">
          Free key at{' '}
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer">ai.google.dev</a>.
          Stored locally — never sent anywhere except Google.
        </p>
        {status === 'invalid' && <p className="settings-error">Invalid key — check and try again.</p>}
        {status === 'valid' && <p className="settings-success">✓ Key valid</p>}
      </div>

      <div className="settings-actions">
        <button className="btn-review" onClick={handleSave} disabled={status === 'validating'}>
          {status === 'validating' ? 'Validating…' : 'Save Key'}
        </button>
        {currentKey && (
          <button className="btn-toolbar" onClick={() => { saveGeminiKey(''); onSave(''); onClose() }}>
            Clear Key
          </button>
        )}
      </div>
    </section>
  )
}
