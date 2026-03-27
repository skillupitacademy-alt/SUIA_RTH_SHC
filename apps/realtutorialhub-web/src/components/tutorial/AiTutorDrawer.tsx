'use client';

import { useState } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';

import { useAiTutor } from './useAiTutor';

interface AiTutorDrawerProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  greeting: string;
}

function dotStyle(index: number) {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#64748b',
    display: 'inline-block',
    animation: `rth-dot-bounce 1s ease-in-out infinite`,
    animationDelay: `${index * 0.15}s`,
  } as const;
}

export function AiTutorDrawer({ subtopicId, subtopicName, theme, greeting }: AiTutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tutor = useAiTutor(greeting, subtopicId, subtopicName);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 70,
          padding: '14px 18px',
          borderRadius: 999,
          border: 'none',
          background: theme.sidebarAccent,
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
          cursor: 'pointer',
        }}
      >
        Ask AI
      </button>

      {isOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(15, 23, 42, 0.46)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              width: 'min(100%, 520px)',
              maxHeight: 'calc(100vh - 48px)',
              overflow: 'hidden',
              borderRadius: 24,
              background: 'var(--design-content-surface)',
              border: 'var(--design-content-border)',
              boxShadow: 'var(--design-shadow)',
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
            }}
          >
            <div style={{ padding: 18, borderBottom: 'var(--design-content-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    AI Tutor
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
                    {subtopicName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '8px 12px',
                    background: 'var(--design-content-surface-soft)',
                    color: 'var(--design-muted)',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.7, color: 'var(--design-muted)' }}>
                Ask a question about the tutorial notes. Answers are generated from the tutorial content and relevant note chunks.
              </p>
            </div>

            <div style={{ padding: 18, overflowY: 'auto', display: 'grid', gap: 10 }}>
              {tutor.messages.map((message) => {
                if (message.kind === 'greeting' || message.kind === 'answer') {
                  return (
                    <div
                      key={message.id}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: 'var(--design-content-surface-soft)',
                        border: 'var(--design-content-border)',
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.sidebarAccent, marginBottom: 4 }}>
                        {message.kind === 'greeting' ? 'AI Tutor' : 'Answer'}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--design-ink)', whiteSpace: 'pre-wrap' }}>{message.text}</div>
                    </div>
                  );
                }

                if (message.kind === 'question') {
                  return (
                    <div
                      key={message.id}
                      style={{
                        marginLeft: 'auto',
                        maxWidth: '92%',
                        padding: 12,
                        borderRadius: 14,
                        background: 'rgba(61, 90, 158, 0.12)',
                        border: '1px solid rgba(61, 90, 158, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, marginBottom: 4 }}>You</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--design-ink)' }}>{message.text}</div>
                    </div>
                  );
                }

                if (message.kind === 'warning' || message.kind === 'error') {
                  return (
                    <div
                      key={message.id}
                      role={message.kind === 'error' ? 'alert' : 'status'}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: message.kind === 'error' ? 'rgba(198, 40, 40, 0.10)' : 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(198, 40, 40, 0.15)',
                        color: message.kind === 'error' ? '#991b1b' : '#92400e',
                      }}
                    >
                      {message.text}
                    </div>
                  );
                }

                if (message.kind === 'chunks') {
                  return (
                    <div
                      key={message.id}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: 'var(--design-content-surface-soft)',
                        border: 'var(--design-content-border)',
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.sidebarAccent, marginBottom: 6 }}>
                        Relevant notes
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--design-muted)', marginBottom: 10 }}>
                        {message.text}
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {message.chunks.map((chunk) => (
                          <div
                            key={`${message.id}-${chunk.blockType}-${chunk.content.slice(0, 12)}`}
                            style={{
                              padding: 10,
                              borderRadius: 12,
                              background: 'var(--design-content-surface)',
                              border: 'var(--design-content-border)',
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, marginBottom: 4 }}>{chunk.blockType}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--design-ink)' }}>{chunk.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {tutor.isLoading ? (
                <div
                  aria-label="Typing indicator"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 999,
                    width: 'fit-content',
                    background: 'var(--design-content-surface-soft)',
                    border: 'var(--design-content-border)',
                  }}
                >
                  <span style={dotStyle(0)} />
                  <span style={dotStyle(1)} />
                  <span style={dotStyle(2)} />
                </div>
              ) : null}
            </div>

            <div style={{ padding: 18, borderTop: 'var(--design-content-border)' }}>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.sidebarAccent }}>Ask the tutor</span>
                <textarea
                  value={tutor.question}
                  onChange={(event) => tutor.setQuestion(event.target.value)}
                  rows={4}
                  placeholder={`Ask a question about ${subtopicName}...`}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    borderRadius: 14,
                    border: 'var(--design-content-border)',
                    padding: 12,
                    font: 'inherit',
                    color: 'var(--design-ink)',
                    background: 'var(--design-surface)',
                  }}
                />
              </label>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 12.5, color: 'var(--design-muted)' }}>
                  {tutor.errorMessage ?? 'Answers use the tutorial notes and related content chunks.'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void tutor.submitQuestion();
                  }}
                  disabled={!tutor.canSubmit}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: theme.sidebarAccent,
                    color: '#fff',
                    opacity: tutor.canSubmit ? 1 : 0.7,
                    fontWeight: 800,
                    cursor: tutor.canSubmit ? 'pointer' : 'not-allowed',
                  }}
                >
                  {tutor.isLoading ? 'Thinking...' : 'Send question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
