'use client';

import { useState } from 'react';

import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';

interface AITutorBlockProps {
  data: TutorialContentJSON['ai_tutor'];
  theme: {
    blockAITutor: string;
    blockAITutorHeader: string;
  };
}

export function AITutorBlock({ data, theme }: AITutorBlockProps) {
  const [question, setQuestion] = useState('');

  return (
    <section className="design-panel" aria-label="AI tutor block">
      <BlockHeader icon="🤖" title="AI Tutor" accentColor={theme.blockAITutorHeader} badge="Chat" />
      <div style={{ padding: 18, background: theme.blockAITutor }}>
        <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: theme.blockAITutorHeader }}>{data.greeting}</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--block-text-secondary)' }}>
            Ask a question after you complete the other blocks.
          </div>
        </div>

        <div
          role="log"
          aria-live="polite"
          style={{
            display: 'grid',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {data.qa_pairs.map((pair) => (
            <div key={pair.question} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.55)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockAITutorHeader, marginBottom: 4 }}>
                Q: {pair.question}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-secondary)' }}>{pair.answer}</div>
            </div>
          ))}
        </div>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockAITutorHeader }}>Ask the tutor</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            placeholder="Type your question here"
            style={{
              width: '100%',
              resize: 'vertical',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.8)',
              padding: 12,
              font: 'inherit',
              background: 'rgba(255,255,255,0.78)',
              color: 'var(--block-text-primary)',
            }}
          />
        </label>

        <button
          type="button"
          disabled
          style={{
            marginTop: 12,
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            background: theme.blockAITutorHeader,
            color: '#fff',
            opacity: 0.7,
            fontWeight: 800,
            cursor: 'not-allowed',
          }}
        >
          Send question
        </button>
      </div>
    </section>
  );
}

