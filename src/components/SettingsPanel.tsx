import { useRef, useState } from 'react'
import type { AIConfig, AIProvider } from '../lib/ai'
import { PROVIDER_HINTS, PROVIDER_LABELS, PROVIDER_MODELS, saveAIConfig } from '../lib/ai'

const PROVIDERS: AIProvider[] = ['gemini', 'openai', 'openrouter', 'anthropic']

interface Props {
  aiConfig: AIConfig
  onSaveAI: (config: AIConfig) => void
  onClose: () => void
  onExportAll: () => void
  onImportAll: (json: string) => void
}

export default function SettingsPanel({ aiConfig, onSaveAI, onClose, onExportAll, onImportAll }: Props) {
  const [provider, setProvider] = useState<AIProvider>(aiConfig.provider)
  const [model, setModel] = useState(aiConfig.model)
  const [apiKey, setApiKey] = useState(aiConfig.apiKey)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleProviderChange(p: AIProvider) {
    setProvider(p)
    setModel(PROVIDER_MODELS[p][0].value)
    setApiKey('')
  }

  function handleSave() {
    const config: AIConfig = { provider, model, apiKey: apiKey.trim() }
    saveAIConfig(config)
    onSaveAI(config)
    onClose()
  }

  function handleImportClick() {
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!window.confirm(`Import "${file.name}"?\n\nThis replaces ALL current articles and Codex data. This cannot be undone.`)) {
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = ev => onImportAll(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  const models = PROVIDER_MODELS[provider]
  const currentModelValid = models.some(m => m.value === model)

  return (
    <section className="settings-panel">
      <header className="settings-header">
        <h2 className="panel-title">Settings</h2>
        <button className="btn-settings-close" onClick={onClose} aria-label="Close settings">✕</button>
      </header>

      <p className="settings-section-title">AI Provider</p>

      <div className="settings-provider-grid">
        {PROVIDERS.map(p => (
          <button
            key={p}
            className={`btn-provider${provider === p ? ' btn-provider--active' : ''}`}
            onClick={() => handleProviderChange(p)}
          >
            {PROVIDER_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="settings-field">
        <label className="field-label">Model</label>
        <select
          className="settings-input"
          value={currentModelValid ? model : models[0].value}
          onChange={e => setModel(e.target.value)}
        >
          {models.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="settings-field">
        <label className="field-label">API Key</label>
        <input
          type="password"
          className="settings-input"
          placeholder="Paste your key…"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && apiKey.trim()) handleSave() }}
        />
        <p className="settings-hint">{PROVIDER_HINTS[provider]}</p>
      </div>

      <div className="settings-actions">
        <button className="btn-review" onClick={handleSave} disabled={!apiKey.trim()}>
          Save
        </button>
        {aiConfig.apiKey && (
          <button className="btn-toolbar" onClick={() => {
            saveAIConfig({ ...aiConfig, apiKey: '' })
            onSaveAI({ ...aiConfig, apiKey: '' })
            onClose()
          }}>
            Clear Key
          </button>
        )}
      </div>

      <p className="settings-section-title">Data</p>

      <div className="settings-actions">
        <button className="btn-export" onClick={onExportAll}>
          Export all articles + Codex (JSON)
        </button>
        <button className="btn-import" onClick={handleImportClick}>
          Import backup (JSON) — replaces all data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </section>
  )
}
