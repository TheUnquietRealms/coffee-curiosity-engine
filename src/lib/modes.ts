import type { WritingMode } from '../types'

export interface ModeConfig {
  label: string
  idealWordRange: [number, number]
  bannedPhrases: string[]
  editorialTip: string
  reviewCategories: string[]
  subtitleExpected: boolean
}

export const MODES: Record<WritingMode, ModeConfig> = {
  essay: {
    label: 'Essay',
    idealWordRange: [800, 3000],
    bannedPhrases: [
      'needless to say', 'goes without saying', 'it\'s clear that',
      'obviously', 'as we can see', 'it is evident',
    ],
    editorialTip: 'Essays earn their length. Every paragraph should do something the previous one cannot.',
    reviewCategories: ['Voice Authenticity', 'Argument Clarity', 'Paragraph Rhythm', 'Evidence Discipline', 'Title Quality', 'Draft Maturity', 'Anti-LLM Smell'],
    subtitleExpected: true,
  },
  fiction: {
    label: 'Fiction',
    idealWordRange: [500, 5000],
    bannedPhrases: [
      'suddenly', 'very quickly', 'he felt', 'she felt', 'they felt',
      'he thought to himself', 'she thought to herself',
      'little did he know', 'little did she know',
      'tears streamed down', 'her heart raced',
    ],
    editorialTip: 'Show the world. Cut the narrator telling you how to feel.',
    reviewCategories: ['Voice Authenticity', 'Paragraph Rhythm', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: false,
  },
  technical: {
    label: 'Technical',
    idealWordRange: [400, 2000],
    bannedPhrases: [
      'simply', 'easy', 'obviously', 'just', 'trivial',
      'straightforward', 'it\'s simple', 'easily', 'of course',
    ],
    editorialTip: 'Precision over brevity. Define your terms once. Use them exactly.',
    reviewCategories: ['Argument Clarity', 'Evidence Discipline', 'Title Quality', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: false,
  },
  journal: {
    label: 'Journal',
    idealWordRange: [100, 1000],
    bannedPhrases: [],
    editorialTip: 'Journals are for the unpolished truth. Write what you noticed, not what you think you should have noticed.',
    reviewCategories: ['Voice Authenticity', 'Paragraph Rhythm', 'Draft Maturity', 'Banned Phrases'],
    subtitleExpected: false,
  },
  email: {
    label: 'Email',
    idealWordRange: [50, 400],
    bannedPhrases: [
      'per my last email', 'as per', 'please find attached',
      'hope this finds you well', 'circling back', 'looping in',
      'going forward', 'at the end of the day', 'touch base',
      'do not hesitate to reach out', 'kind regards',
    ],
    editorialTip: 'One ask per email. State it in the first two sentences.',
    reviewCategories: ['Banned Phrases', 'Anti-LLM Smell', 'Argument Clarity', 'Draft Maturity'],
    subtitleExpected: false,
  },
  linkedin: {
    label: 'LinkedIn',
    idealWordRange: [150, 700],
    bannedPhrases: [
      'excited to announce', 'humbled', 'thought leader', 'synergy',
      'crush it', 'game changer', 'disruptive', 'passionate about',
      'thrilled to share', 'incredible journey', 'blessed', 'grateful to',
      'proud to announce', 'giving back', 'making a difference',
    ],
    editorialTip: 'LinkedIn rewards specificity. Replace the emotion with the fact.',
    reviewCategories: ['Banned Phrases', 'Anti-LLM Smell', 'Title Quality', 'Draft Maturity'],
    subtitleExpected: false,
  },
  medium: {
    label: 'Medium',
    idealWordRange: [800, 2500],
    bannedPhrases: [
      'hot take', 'unpopular opinion', 'this changes everything',
      'you need to know', 'the truth about', 'nobody talks about',
      'what they don\'t tell you',
    ],
    editorialTip: 'Medium readers skim. Make every section header a payoff, not a promise.',
    reviewCategories: ['Voice Authenticity', 'Argument Clarity', 'Title Quality', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: true,
  },
  substack: {
    label: 'Substack',
    idealWordRange: [600, 3000],
    bannedPhrases: [
      'in conclusion', 'to summarize', 'needless to say',
      'as i always say', 'long-time readers know',
    ],
    editorialTip: 'Your readers subscribed for your take. Lead with it.',
    reviewCategories: ['Voice Authenticity', 'Argument Clarity', 'Paragraph Rhythm', 'Evidence Discipline', 'Title Quality', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: true,
  },
  'github-docs': {
    label: 'GitHub Docs',
    idealWordRange: [200, 1500],
    bannedPhrases: [
      'simply', 'easy', 'just', 'obviously', 'you should',
      'trivial', 'of course', 'it goes without saying',
    ],
    editorialTip: 'Docs are not tutorials are not references. Know which one you\'re writing.',
    reviewCategories: ['Argument Clarity', 'Evidence Discipline', 'Title Quality', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: false,
  },
  poem: {
    label: 'Poem',
    idealWordRange: [10, 200],
    bannedPhrases: ['like a', 'as if', 'suddenly', 'very', 'really', 'beautiful', 'amazing', 'wonderful'],
    editorialTip: 'Every word earns its place. Cut until it hurts, then cut again.',
    reviewCategories: ['Voice Authenticity', 'Paragraph Rhythm', 'Banned Phrases', 'Draft Maturity'],
    subtitleExpected: false,
  },
  'book-chapter': {
    label: 'Book Chapter',
    idealWordRange: [1000, 6000],
    bannedPhrases: ['suddenly', 'he felt', 'she felt', 'they felt', 'little did he know', 'little did she know', 'tears streamed down', 'her heart raced', 'needless to say'],
    editorialTip: 'Each chapter must move something — plot, character, or world. If nothing shifts, cut it.',
    reviewCategories: ['Voice Authenticity', 'Paragraph Rhythm', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: true,
  },
  research: {
    label: 'Research Paper',
    idealWordRange: [2000, 8000],
    bannedPhrases: ['it is clear that', 'obviously', 'needless to say', 'simply', 'of course', 'as we can see', 'in conclusion', 'to summarize'],
    editorialTip: 'State your claim, show your evidence, address the counterargument. In that order, every time.',
    reviewCategories: ['Argument Clarity', 'Evidence Discipline', 'Title Quality', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: true,
  },
  screenplay: {
    label: 'Screenplay',
    idealWordRange: [500, 4000],
    bannedPhrases: ['suddenly', 'very', 'really', 'quickly', 'he thought', 'she thought', 'we see', 'it is revealed'],
    editorialTip: 'If it cannot be filmed, it cannot be in the script. Show action, not interiority.',
    reviewCategories: ['Voice Authenticity', 'Paragraph Rhythm', 'Banned Phrases', 'Draft Maturity'],
    subtitleExpected: false,
  },
  blog: {
    label: 'Blog Post',
    idealWordRange: [400, 1500],
    bannedPhrases: ['in this post', 'in this article', 'we will explore', 'we will discuss', 'hot take', 'unpopular opinion', 'you need to know', 'game changer', 'thought leader'],
    editorialTip: 'Lead with the payoff. Your reader decided in the first sentence whether to stay.',
    reviewCategories: ['Voice Authenticity', 'Argument Clarity', 'Title Quality', 'Banned Phrases', 'Anti-LLM Smell', 'Draft Maturity'],
    subtitleExpected: true,
  },
}

export const DEFAULT_MODE: WritingMode = 'essay'

export const MODE_LIST: { value: WritingMode; label: string }[] = [
  { value: 'essay', label: 'Essay' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'technical', label: 'Technical' },
  { value: 'journal', label: 'Journal' },
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'medium', label: 'Medium' },
  { value: 'substack', label: 'Substack' },
  { value: 'github-docs', label: 'GitHub Docs' },
  { value: 'poem', label: 'Poem' },
  { value: 'book-chapter', label: 'Book Chapter' },
  { value: 'research', label: 'Research Paper' },
  { value: 'screenplay', label: 'Screenplay' },
  { value: 'blog', label: 'Blog Post' },
]
