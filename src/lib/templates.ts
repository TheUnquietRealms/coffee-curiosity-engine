import type { WritingMode } from '../types'

export const TEMPLATES: Record<WritingMode, string> = {
  essay: `## Opening claim

[State your argument in one sentence. Make it arguable.]

## Context

[Why does this matter now? What's the situation the reader is walking into?]

## The argument

[Make your case. One paragraph per move. Each paragraph earns the next.]

## The complication

[Steel-man the opposing view. What's the strongest case against you?]

## Resolution

[How do you answer the complication? What does that reveal?]

## Closing

[Land the piece. Don't summarise — add something. The last line should surprise.]`,

  substack: `Dear reader,

[Opening line that earns the click. Specific, not general.]

---

[First move: the observation, the question, the tension.]

[Second move: where it leads. Your actual thinking.]

[Third move: the turn. What you didn't expect to find.]

---

[Closing note. Personal, brief. Something that makes them want the next one.]

— [Your name]`,

  linkedin: `[Hook — one sentence that stops the scroll. A counterintuitive claim or specific number.]

[Context — 2–3 sentences. Why this matters, what led you here.]

[The insight — the actual thing you learned. Specific, not vague.]

[Evidence — one concrete example, data point, or story.]

[Takeaway — what should the reader do or think differently?]

[Call to action — question to prompt replies, or soft close.]`,

  medium: `# [Title]

[Subheading — expand the title with a specific angle.]

---

[Lead — a scene, a moment, a surprising fact. Draw them in fast.]

[Context — what's this really about? Why now?]

---

## [First section heading]

[Body. Each section has one job. Don't meander.]

## [Second section heading]

[Continue. Vary sentence length. Short for impact. Longer sentences for momentum and nuance.]

---

[Conclusion — return to the opening, but with new meaning. Don't summarise. Close the loop.]`,

  technical: `## Overview

[One paragraph: what this is, what problem it solves, who it's for.]

## Prerequisites

- [Requirement 1]
- [Requirement 2]

## Steps

### 1. [First step]

[What to do. Then why, if non-obvious.]

\`\`\`
[Code or command]
\`\`\`

### 2. [Second step]

[Continue the pattern.]

## Verification

[How to confirm it worked.]

## Troubleshooting

**[Common error]:** [How to fix it.]

## Next steps

- [Link or follow-on action]`,

  journal: `[Date] — [One word for the day]

---

[What happened. Factual. No interpretation yet.]

---

[What I made of it. First instinct.]

[What I'm less sure about.]

[What I want to remember from this.]

---

[Tomorrow: one thing I want to carry forward.]`,

  email: `Subject: [Specific, not vague — tell them what this is]

Hi [Name],

[First sentence: state why you're writing, immediately. No warm-up.]

[Body: one clear ask or one clear piece of information. Not both.]

[If you need context, put it after the ask, not before.]

[Closing line: what happens next? Who does what?]

[Sign-off],
[Your name]`,

  blog: `# [Title — make it earn the click]

[Opening — a hook. A question, a scene, or a bold claim. 2–3 sentences max.]

[Bridge — what you're going to cover and why it matters to them.]

---

## [Section 1]

[Write for scanners: short paragraphs, clear topic sentences.]

## [Section 2]

[One idea per section. If you can't summarise a section in one sentence, split it.]

## [Section 3]

[Vary the format — lists, examples, direct address.]

---

[Outro — bring it back to the opening. What should they do now?]`,

  poem: `[First stanza — the image, the entry point.]

[Second stanza — complicate it. Introduce tension or movement.]

[Third stanza — the turn. Something shifts.]

[Final stanza — the landing. Don't explain. Let the image carry it.]`,

  fiction: `[Scene heading — place, time, light]

[Opening action — something is already happening. Don't orient the reader, drop them in.]

[Character enters the scene through action, not description.]

[Dialogue — characters want something. Every line advances or reveals.]

"[First line of dialogue]," [character] said. "[A beat, an action, a telling detail.]"

"[Reply that doesn't answer directly]."

[Scene turn — what changes? What does the character now know or want that they didn't before?]

[Closing image — something concrete. Let it resonate.]`,

  'book-chapter': `## Chapter [N]: [Working title]

[Opening scene — in medias res. We're already in the middle of something.]

[Establish place, time, character state — through action and detail, not summary.]

---

[Rising action — the chapter has one main movement. What is it?]

[Scene break with *** or line]

***

[Second scene or continuation — complicate the opening movement.]

---

[Chapter close — end on a question, a revelation, or a line that makes turning the page feel necessary.]`,

  research: `## Abstract

[250 words max. Problem, method, findings, significance. Written last.]

## Introduction

[What is the question? Why does it matter? What gap does this fill?]

## Background

[What do we already know? Key sources, existing frameworks.]

## Method / Approach

[What did you do? How did you gather or analyse evidence?]

## Findings

[What did you find? Present without interpretation first.]

## Discussion

[What does it mean? How does it connect to the background?]

## Conclusion

[Summary of contribution. Limitations. Directions for further work.]

## References`,

  screenplay: `INT. [LOCATION] - [DAY/NIGHT]

[Action line — what we see. Active voice. Present tense. No camera directions.]

[Describe only what the camera can capture. No internal states.]

CHARACTER NAME
(parenthetical — use sparingly)
[Dialogue. People don't speak in full sentences. They interrupt, deflect, lie.]

SECOND CHARACTER
[Reply — subtext. What they mean vs. what they say.]

[Action beat — something physical happens. Moves the scene forward.]`,

  'github-docs': `# [Feature or API name]

> [One-sentence description — what this is and what it does.]

## Overview

[2–3 sentences: purpose, when to use it, what it replaces or complements.]

## Quick start

\`\`\`bash
[Minimal working example]
\`\`\`

## Usage

### [Common use case 1]

[Description]

\`\`\`
[Code example]
\`\`\`

### [Common use case 2]

[Description]

## Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`param\` | \`string\` | — | [What it does] |

## Related

- [Link to related doc]`,
}
