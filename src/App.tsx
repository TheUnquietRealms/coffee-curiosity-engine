import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { Article, ArticleStatus, Codex, CodexOverrides, Snapshot, WritingMode } from './types'
import {
  loadArticles, saveArticles,
  loadSelectedId, saveSelectedId,
  loadCodex, saveCodex,
  loadCodexOverrides, saveCodexOverrides, effectiveCodex,
  loadSnapshots, saveSnapshot,
  createArticle,
  hasCompletedOnboarding, markOnboardingComplete,
  exportAllData, importAllData,
} from './lib/storage'
import { DEFAULT_CODEX } from './lib/storage'
import { checkGrammar } from './lib/languageTool'
import type { LTMatch } from './lib/languageTool'
import { loadAIConfig, saveAIConfig } from './lib/ai'
import type { AIConfig } from './lib/ai'
import ArticleNavigator from './components/ArticleNavigator'
import Editor from './components/Editor'
import CodexPanel from './components/CodexPanel'
import ReviewPanel from './components/ReviewPanel'
import GrammarPanel from './components/GrammarPanel'
import SettingsPanel from './components/SettingsPanel'
import AIPanel from './components/AIPanel'
import OnboardingModal from './components/OnboardingModal'
import ShortcutsModal from './components/ShortcutsModal'

export type SaveStatus = 'idle' | 'saving' | 'saved'

export default function App() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [codex, setCodex] = useState<Codex>(DEFAULT_CODEX)
  const [codexOverrides, setCodexOverrides] = useState<CodexOverrides>({})
  const [rightTab, setRightTab] = useState<'codex' | 'review' | 'grammar' | 'ai'>('codex')
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => loadAIConfig())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [focusMode, setFocusMode] = useState(false)
  const [grammarMatches, setGrammarMatches] = useState<LTMatch[]>([])
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [grammarError, setGrammarError] = useState<string | null>(null)
  const [grammarCooldown, setGrammarCooldown] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [navMobileOpen, setNavMobileOpen] = useState(false)
  const [rightPanelMobileOpen, setRightPanelMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [reviewTrigger, setReviewTrigger] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('cce_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('cce_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Article[]>([])

  useEffect(() => {
    let loaded = loadArticles()
    const savedId = loadSelectedId()
    const savedCodex = loadCodex()
    const savedOverrides = loadCodexOverrides()

    if (!loaded.length) {
      const first = createArticle()
      loaded = [first]
      saveArticles(loaded)
      saveSelectedId(first.id)
      setSelectedId(first.id)
    } else {
      const validId = savedId && loaded.find(a => a.id === savedId) ? savedId : loaded[0].id
      setSelectedId(validId)
      saveSelectedId(validId)
      setSnapshots(loadSnapshots(validId))
    }

    setArticles(loaded)
    setCodex(savedCodex)
    setCodexOverrides(savedOverrides)
    pendingRef.current = loaded

    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true)
    }
  }, [])

  const selected = useMemo(
    () => articles.find(a => a.id === selectedId) ?? null,
    [articles, selectedId]
  )

  const activeCodex = useMemo(
    () => selected ? effectiveCodex(codex, codexOverrides, selected.mode) : codex,
    [codex, codexOverrides, selected?.mode]
  )

  const handleArticlesUpdate = useCallback((updated: Article[]) => {
    setArticles(updated)
    pendingRef.current = updated
    saveArticles(updated)
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    saveSelectedId(id)
    setSnapshots(loadSnapshots(id))
  }, [])

  const handleArticleChange = useCallback((article: Article) => {
    setArticles(prev => {
      const updated = prev.map(a => a.id === article.id ? article : a)
      pendingRef.current = updated
      return updated
    })

    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      saveArticles(pendingRef.current)
      setSaveStatus('saved')
      fadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500)
    }, 400)
  }, [])

  const handleCodexChange = useCallback((updated: Codex) => {
    setCodex(updated)
    saveCodex(updated)
  }, [])

  const handleOverrideChange = useCallback((updated: CodexOverrides) => {
    setCodexOverrides(updated)
    saveCodexOverrides(updated)
  }, [])

  const handleOnboardingComplete = useCallback((updatedCodex: Codex, defaultMode: WritingMode) => {
    setCodex(updatedCodex)
    saveCodex(updatedCodex)
    setArticles(prev => {
      if (!prev.length) return prev
      const updated = prev.map((a, i) => i === 0 ? { ...a, mode: defaultMode } : a)
      saveArticles(updated)
      pendingRef.current = updated
      return updated
    })
    markOnboardingComplete()
    setShowOnboarding(false)
  }, [])

  const handleSaveAI = useCallback((config: AIConfig) => {
    setAIConfig(config)
    saveAIConfig(config)
  }, [])

  const handleExportAll = useCallback(() => {
    exportAllData()
  }, [])

  const handleImportAll = useCallback((json: string) => {
    try {
      const { articles: imported, codex: importedCodex, codexOverrides: importedOverrides } = importAllData(json)
      const validId = imported.length ? imported[0].id : null
      setArticles(imported)
      setCodex(importedCodex)
      setCodexOverrides(importedOverrides)
      pendingRef.current = imported
      if (validId) {
        setSelectedId(validId)
        saveSelectedId(validId)
        setSnapshots(loadSnapshots(validId))
      }
      setShowSettings(false)
    } catch (e) {
      alert('Import failed: ' + (e instanceof Error ? e.message : 'Invalid file'))
    }
  }, [])

  const handleSaveSnapshot = useCallback(() => {
    if (!selected) return
    const updated = saveSnapshot(selected.id, selected.body)
    setSnapshots(updated)
  }, [selected])

  const handleRestoreSnapshot = useCallback((body: string) => {
    if (!selected) return
    handleArticleChange({ ...selected, body })
  }, [selected, handleArticleChange])

  const handleNewArticle = useCallback(() => {
    const article = createArticle({ title: 'Untitled' })
    handleArticlesUpdate([...articles, article])
    handleSelect(article.id)
  }, [articles, handleArticlesUpdate, handleSelect])

  const handleStatusChange = useCallback((status: ArticleStatus) => {
    if (!selected) return
    handleArticleChange({ ...selected, status })
    if (status === 'review') {
      setRightTab('review')
      setReviewTrigger(t => t + 1)
    }
  }, [selected, handleArticleChange])

  const handleGrammarCheck = useCallback(async () => {
    if (!selected || grammarCooldown) return
    setGrammarLoading(true)
    setGrammarError(null)
    setRightTab('grammar')
    try {
      const result = await checkGrammar(selected.body)
      setGrammarMatches(result.matches)
    } catch (e) {
      setGrammarError(e instanceof Error ? e.message : 'Grammar check failed')
    } finally {
      setGrammarLoading(false)
      setGrammarCooldown(true)
      setTimeout(() => setGrammarCooldown(false), 3000)
    }
  }, [selected, grammarCooldown])

  const handleApplyReplacement = useCallback((match: LTMatch, replacement: string) => {
    if (!selected) return
    const body = selected.body.slice(0, match.offset) + replacement + selected.body.slice(match.offset + match.length)
    handleArticleChange({ ...selected, body })
    setGrammarMatches(prev => prev.filter(m => m !== match))
  }, [selected, handleArticleChange])

  const handleAppendToBody = useCallback((text: string) => {
    if (!selected) return
    handleArticleChange({ ...selected, body: selected.body + text })
  }, [selected, handleArticleChange])

  const handleSetOutline = useCallback((text: string) => {
    if (!selected) return
    handleArticleChange({ ...selected, outline: text })
  }, [selected, handleArticleChange])

  function startTimer() {
    if (Notification.permission === 'default') Notification.requestPermission()
    setTimerSeconds(25 * 60)
    setTimerRunning(true)
  }

  function toggleTimer() {
    if (timerSeconds === null) { startTimer(); return }
    setTimerRunning(r => !r)
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(null)
    setTimerRunning(false)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      if (mod && e.shiftKey) {
        if (e.key === 'N') { e.preventDefault(); handleNewArticle() }
        if (e.key === 'F') { e.preventDefault(); setFocusMode(f => !f) }
        if (e.key === 'R') { e.preventDefault(); setRightTab('review'); setReviewTrigger(t => t + 1) }
        if (e.key === 'G') { e.preventDefault(); handleGrammarCheck() }
        if (e.key === 'S') { e.preventDefault(); handleSaveSnapshot() }
        if (e.key === '1') { e.preventDefault(); setRightTab('codex') }
        if (e.key === '2') { e.preventDefault(); setRightTab('review') }
        if (e.key === '3') { e.preventDefault(); setRightTab('grammar') }
        if (e.key === '4') { e.preventDefault(); setRightTab('ai') }
      }
      if (e.key === '?' && !inField) setShowShortcuts(s => !s)
      if (e.key === 'Escape') {
        setShowShortcuts(false)
        setNavMobileOpen(false)
        setRightPanelMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleNewArticle, handleGrammarCheck, handleSaveSnapshot])

  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return
    timerRef.current = setInterval(() => {
      setTimerSeconds(s => {
        if (s === null || s <= 1) {
          clearInterval(timerRef.current!)
          setTimerRunning(false)
          if (Notification.permission === 'granted') {
            new Notification("The Writer — Time's up!", { body: '25 minutes done. Take a break.' })
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          defaultCodex={codex}
          onComplete={handleOnboardingComplete}
        />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {navMobileOpen && <div className="mobile-overlay" onClick={() => setNavMobileOpen(false)} />}
      {rightPanelMobileOpen && <div className="mobile-overlay mobile-overlay--right" onClick={() => setRightPanelMobileOpen(false)} />}
      <div className={`app-shell${focusMode ? ' app-shell--focus' : ''}`}>
        <div className={`nav-drawer${navMobileOpen ? ' nav-drawer--open' : ''}`}>
          {showSettings
            ? <SettingsPanel
                aiConfig={aiConfig}
                onSaveAI={handleSaveAI}
                onClose={() => setShowSettings(false)}
                onExportAll={handleExportAll}
                onImportAll={handleImportAll}
              />
            : <ArticleNavigator
                articles={articles}
                selectedId={selectedId}
                onSelect={handleSelect}
                onUpdate={handleArticlesUpdate}
                onOpenSettings={() => setShowSettings(true)}
                onMobileClose={() => setNavMobileOpen(false)}
              />
          }
        </div>
        <Editor
          article={selected}
          onChange={handleArticleChange}
          saveStatus={saveStatus}
          codex={activeCodex}
          snapshots={snapshots}
          onSaveSnapshot={handleSaveSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
          onStatusChange={handleStatusChange}
          onToggleNav={() => setNavMobileOpen(n => !n)}
          onToggleRightPanel={() => setRightPanelMobileOpen(r => !r)}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode(f => !f)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          onGrammarCheck={handleGrammarCheck}
          grammarCooldown={grammarCooldown}
          timerSeconds={timerSeconds}
          timerRunning={timerRunning}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
        />
        <div className={`right-panel${rightPanelMobileOpen ? ' right-panel--mobile-open' : ''}`}>
          <div className="right-tabs">
            <button
              className={`tab-btn${rightTab === 'codex' ? ' tab-btn--active' : ''}`}
              onClick={() => setRightTab('codex')}
            >
              Codex
            </button>
            <button
              className={`tab-btn${rightTab === 'review' ? ' tab-btn--active' : ''}`}
              onClick={() => setRightTab('review')}
            >
              Review
            </button>
            <button
              className={`tab-btn${rightTab === 'grammar' ? ' tab-btn--active' : ''}`}
              onClick={() => setRightTab('grammar')}
            >
              Grammar
            </button>
            <button
              className={`tab-btn${rightTab === 'ai' ? ' tab-btn--active' : ''}`}
              onClick={() => setRightTab('ai')}
            >
              AI
            </button>
          </div>
          {rightTab === 'ai'
            ? <AIPanel
                article={selected}
                codex={activeCodex}
                aiConfig={aiConfig}
                onAppendToBody={handleAppendToBody}
                onSetOutline={handleSetOutline}
              />
            : rightTab === 'grammar'
            ? <GrammarPanel matches={grammarMatches} article={selected} onApply={handleApplyReplacement} loading={grammarLoading} error={grammarError} />
            : rightTab === 'codex'
            ? <CodexPanel
                codex={codex}
                onChange={handleCodexChange}
                currentMode={selected?.mode}
                overrides={codexOverrides}
                onOverrideChange={handleOverrideChange}
              />
            : <ReviewPanel article={selected} codex={activeCodex} autoRunTrigger={reviewTrigger} />
          }
        </div>
      </div>
    </>
  )
}
