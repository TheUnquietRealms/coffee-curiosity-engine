import React from 'react';

export default function App() {
  return React.createElement(
    'main',
    { className: 'app-shell' },
    React.createElement(
      'section',
      { className: 'panel left' },
      React.createElement('h2', null, 'Articles'),
      React.createElement('button', null, 'New Article'),
      React.createElement('p', null, 'The First Draft')
    ),
    React.createElement(
      'section',
      { className: 'panel editor' },
      React.createElement('p', { className: 'eyebrow' }, 'draft · review · published'),
      React.createElement('h1', null, 'The First Draft'),
      React.createElement('input', { value: 'Where everything begins and nothing is wasted', readOnly: true }),
      React.createElement('textarea', {
        defaultValue: 'She stared at me from across the way as I stared back at her through the cafe window.',
        rows: 18
      }),
      React.createElement('button', null, 'Export MD')
    ),
    React.createElement(
      'section',
      { className: 'panel right' },
      React.createElement('h2', null, 'Codex'),
      React.createElement('p', null, 'Voice rules, banned AI habits, recurring themes, source notes, and publication checklist.'),
      React.createElement('h2', null, 'Editorial Review'),
      React.createElement('div', { className: 'score' }, '65'),
      React.createElement('p', null, 'Solid foundation. Address the flagged categories.')
    )
  );
}
