import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'coffee-curiosity-engine.v1';
const SELECTED_KEY = 'coffee-curiosity-engine.selected';
const modes = ['Essay', 'Fiction', 'Technical', 'Journal', 'Email', 'LinkedIn', 'Medium', 'Substack', 'GitHub Docs'];

const defaultArticle = {
  id: 'first-draft',
  title: 'The First Draft',
  subtitle: 'Where everything begins and nothing is wasted',
  body: 'She stared at me from across the way as I stared back at her through the cafe window.',
  status: 'draft',
  mode: 'Fiction',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const defaultCodex = {
  voiceRules: 'Reflective, direct, human-paced prose. Preserve the edge. Avoid generic AI cadence.',
  bannedHabits: 'In summary, key takeaway, here is a breakdown, it depends, let us unpack this',
  themes: 'systems, institutions, technology, meaning, human behaviour, public reasoning',
  sourceNotes: '',
  checklist: 'Clear title. Strong subtitle. Human rhythm. No AI smell. Publishable ending.'
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { articles: [defaultArticle], codex: defaultCodex };
    const parsed = JSON.parse(stored);
    const articles = Array.isArray(parsed.articles) && parsed.articles.length ? parsed.articles : [defaultArticle];
    return {
      articles: articles.map((a) => ({ ...defaultArticle, ...a, mode: a.mode || 'Essay' })),
      codex: { ...defaultCodex, ...(parsed.codex || {}) }
    };
  } catch {
    return { articles: [defaultArticle], codex: defaultCodex };
  }
}

function countWords(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function getParagraphs(text) {
  return (text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function detectBanned(text, codex) {
  const phrases = `${codex.bannedHabits || ''}, as an ai, delve, tapestry, unlock, game changer, key takeaway, in summary, here is a breakdown`
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const lower = (text || '').toLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase));
}

function runReview(article, codex) {
  const words = countWords(article.body);
  const paragraphs = getParagraphs(article.body);
  const banned = detectBanned(`${article.title} ${article.subtitle} ${article.body}`, codex);
  const hasTitle = article.title.trim().length > 3;
  const hasSubtitle = article.subtitle.trim().length > 8;
  const maturity = Math.min(100, Math.round((words / 800) * 100));
  const rhythm = paragraphs.length <= 1 && words > 120 ? 45 : paragraphs.length >= 2 ? 78 : 60;

  const common = [
    { category: 'Voice Authenticity', score: banned.length ? 45 : 92, note: banned.length ? `Flagged phrases: ${banned.join(', ')}` : 'No obvious AI cadence or banned phrases detected.' },
    { category: 'Title Quality', score: hasTitle ? 82 : 35, note: hasTitle ? 'Title is present and usable.' : 'Title needs a clearer signal.' },
    { category: 'Subtitle Quality', score: hasSubtitle ? 80 : 40, note: hasSubtitle ? 'Subtitle gives the draft a usable frame.' : 'Subtitle needs more intent.' },
    { category: 'Paragraph Rhythm', score: rhythm, note: rhythm > 70 ? 'Paragraph rhythm is readable.' : 'Break the draft into more natural paragraphs.' },
    { category: 'Draft Maturity', score: maturity, note: `${words} words. ${words < 300 ? 'Still early draft territory.' : 'Enough material for a serious pass.'}` }
  ];

  const modeSpecific = {
    Fiction: [
      { category: 'Atmosphere', score: words > 20 ? 72 : 55, note: 'Assess whether the scene has mood, texture, and presence.' },
      { category: 'Scene Tension', score: words > 40 ? 68 : 50, note: 'The scene needs a clearer pull or unresolved question.' },
      { category: 'Continuation Pull', score: words > 30 ? 70 : 45, note: 'The reader should feel why the next sentence matters.' }
    ],
    Technical: [
      { category: 'Precision', score: words > 80 ? 70 : 45, note: 'Technical writing needs definitions, terms, and structure.' },
      { category: 'Executive Clarity', score: hasSubtitle ? 72 : 45, note: 'Make the decision, risk, or architecture implication clear.' },
      { category: 'Terminology Consistency', score: 75, note: 'No obvious terminology conflict detected in this pass.' }
    ],
    Essay: [
      { category: 'Argument Clarity', score: words > 300 ? 72 : 45, note: 'Essay mode needs a visible argument once the draft matures.' },
      { category: 'Evidence Discipline', score: words > 500 ? 68 : 40, note: 'Add examples, sources, or concrete observations as the draft grows.' },
      { category: 'Publication Readiness', score: words > 900 ? 75 : 40, note: 'Not yet publication length for an essay.' }
    ],
    Journal: [
      { category: 'Honesty', score: 85, note: 'Journal mode values directness over polish.' },
      { category: 'Reflection Depth', score: words > 120 ? 72 : 50, note: 'Push one level deeper into what this means.' }
    ],
    Email: [
      { category: 'Directness', score: words < 400 ? 80 : 55, note: 'Email should stay clear and purposeful.' },
      { category: 'Action Clarity', score: 60, note: 'Make the ask or next step explicit.' }
    ],
    LinkedIn: [
      { category: 'Hook Strength', score: hasTitle ? 68 : 45, note: 'LinkedIn needs a stronger opening claim.' },
      { category: 'Professional Signal', score: 72, note: 'Keep it sharp without making it corporate.' }
    ],
    Medium: [
      { category: 'Public Essay Flow', score: words > 500 ? 72 : 45, note: 'Medium needs a clean public argument arc.' },
      { category: 'Reader Accessibility', score: 70, note: 'Make the idea easy to enter without flattening it.' }
    ],
    Substack: [
      { category: 'Slow-Read Voice', score: rhythm, note: 'Substack mode should preserve human pacing and reflective flow.' },
      { category: 'Personal Frame', score: words > 200 ? 70 : 45, note: 'Anchor the idea in lived observation or a clear scene.' }
    ],
    'GitHub Docs': [
      { category: 'Structure', score: words > 100 ? 70 : 45, note: 'GitHub docs need sections, purpose, and implementation clarity.' },
      { category: 'Operational Usefulness', score: 60, note: 'Make the document actionable for a reader in the repo.' }
    ]
  };

  const categories = [...common, ...(modeSpecific[article.mode] || modeSpecific.Essay)];
  const overall = Math.round(categories.reduce((sum, item) => sum + item.score, 0) / categories.length);
  return { overall, summary: overall > 75 ? 'Strong working draft. Continue shaping.' : 'Solid foundation. Address the flagged categories.', categories, reviewedAt: new Date().toISOString(), mode: article.mode };
}

function exportMarkdown(article) {
  const markdown = `# ${article.title}\n\n${article.subtitle ? `_${article.subtitle}_\n\n` : ''}${article.body}\n`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${article.title || 'draft'}.md`.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const initial = useMemo(() => loadState(), []);
  const [articles, setArticles] = useState(initial.articles);
  const [codex, setCodex] = useState(initial.codex);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(SELECTED_KEY) || initial.articles[0].id);
  const [review, setReview] = useState(null);

  const selected = articles.find((a) => a.id === selectedId) || articles[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ articles, codex }));
  }, [articles, codex]);

  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId]);

  function updateArticle(patch) {
    setArticles((items) => items.map((item) => item.id === selected.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
  }

  function createArticle() {
    const id = `article-${Date.now()}`;
    const article = { ...defaultArticle, id, title: 'Untitled Draft', subtitle: '', body: '', status: 'draft', mode: 'Essay', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setArticles((items) => [article, ...items]);
    setSelectedId(id);
    setReview(null);
  }

  function deleteArticle(id) {
    if (articles.length === 1) return;
    const remaining = articles.filter((a) => a.id !== id);
    setArticles(remaining);
    if (selectedId === id) setSelectedId(remaining[0].id);
    setReview(null);
  }

  const words = countWords(selected.body);
  const readingTime = Math.max(1, Math.ceil(words / 220));

  return (
    <main className="app-shell">
      <section className="panel left">
        <h2>Articles</h2>
        <button onClick={createArticle}>New Article</button>
        <div className="article-list">
          {articles.map((article) => (
            <div key={article.id} className={article.id === selected.id ? 'article-item active' : 'article-item'}>
              <button className="article-button" onClick={() => { setSelectedId(article.id); setReview(null); }}>{article.title || 'Untitled Draft'}</button>
              <span className="mode-pill">{article.mode || 'Essay'}</span>
              {articles.length > 1 && <button className="delete-button" onClick={() => deleteArticle(article.id)}>Delete</button>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel editor">
        <div className="editor-toolbar">
          <select value={selected.status} onChange={(event) => updateArticle({ status: event.target.value })}>
            {['draft', 'review', 'published'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={selected.mode} onChange={(event) => { updateArticle({ mode: event.target.value }); setReview(null); }}>
            {modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
          <button onClick={() => exportMarkdown(selected)}>Export MD</button>
        </div>
        <input value={selected.title} onChange={(event) => updateArticle({ title: event.target.value })} placeholder="Title" />
        <input value={selected.subtitle} onChange={(event) => updateArticle({ subtitle: event.target.value })} placeholder="Subtitle" />
        <textarea value={selected.body} onChange={(event) => updateArticle({ body: event.target.value })} rows={18} placeholder="Start writing..." />
        <p className="editor-meta">{words} words · {readingTime} min read · saved locally</p>
      </section>

      <section className="panel right">
        <h2>Codex</h2>
        <label>Voice rules</label>
        <textarea value={codex.voiceRules} onChange={(event) => setCodex({ ...codex, voiceRules: event.target.value })} rows={3} />
        <label>Banned AI habits</label>
        <textarea value={codex.bannedHabits} onChange={(event) => setCodex({ ...codex, bannedHabits: event.target.value })} rows={3} />
        <label>Recurring themes</label>
        <textarea value={codex.themes} onChange={(event) => setCodex({ ...codex, themes: event.target.value })} rows={3} />
        <h2>Editorial Review</h2>
        <span className="review-mode-badge">{selected.mode}</span>
        <button onClick={() => setReview(runReview(selected, codex))}>Run Review</button>
        {review ? (
          <div>
            <div className="score">{review.overall}</div>
            <p>{review.summary}</p>
            {review.categories.map((item) => (
              <div key={item.category} className="review-row">
                <strong>{item.category}: {item.score}</strong>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        ) : <p>Run review when the draft is ready for an editorial pass.</p>}
      </section>
    </main>
  );
}
