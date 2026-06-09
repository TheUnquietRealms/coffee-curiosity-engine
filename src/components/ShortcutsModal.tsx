import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

const SHORTCUTS = [
  { keys: '⌘⇧N / Ctrl⇧N', desc: 'New article' },
  { keys: '⌘⇧F / Ctrl⇧F', desc: 'Toggle focus mode' },
  { keys: '⌘⇧R / Ctrl⇧R', desc: 'Run review' },
  { keys: '⌘⇧G / Ctrl⇧G', desc: 'Grammar check' },
  { keys: '⌘⇧S / Ctrl⇧S', desc: 'Save checkpoint' },
  { keys: '⌘⇧1–4 / Ctrl⇧1–4', desc: 'Switch panels (Codex / Review / Grammar / AI)' },
  { keys: '?', desc: 'Show this help (when not in a text field)' },
  { keys: 'Esc', desc: 'Close this panel / close drawer' },
]

export default function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <div className="shortcuts-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2 className="panel-title">Keyboard Shortcuts</h2>
          <button className="btn-settings-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map(s => (
              <tr key={s.desc}>
                <td className="shortcut-keys">{s.keys}</td>
                <td className="shortcut-desc">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="shortcuts-note">⌘ = Cmd on Mac · Ctrl on Windows / Linux</p>
      </div>
    </div>
  )
}
