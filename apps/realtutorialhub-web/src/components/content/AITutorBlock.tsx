'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';

type Difficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';

type AiTutorMessage =
  | { id: string; role: 'assistant'; kind: 'greeting' | 'answer'; text: string }
  | { id: string; role: 'user'; kind: 'question'; text: string }
  | { id: string; role: 'assistant'; kind: 'chunks'; chunks: Array<{ blockType: string; content: string }>; text: string }
  | { id: string; role: 'system'; kind: 'error' | 'warning'; text: string };

interface AITutorBlockProps {
  data: TutorialContentJSON['ai_tutor'] | null | undefined;
  theme: {
    blockAITutor: string;
    blockAITutorHeader: string;
  };
  subtopicId?: string;
  subtopicName?: string;
  difficulty?: Difficulty;
}

interface AiTutorQueryResponse {
  source: 'qa_pairs' | 'vector_search';
  answer: string | null;
  chunks: Array<{ blockType: string; content: string; score?: number }> | null;
}

function createMessageId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AITutorBlock({
  data,
  theme,
  subtopicId = '11111111-1111-1111-1111-111111111111',
  subtopicName = 'this subtopic',
  difficulty = 'simple',
}: AITutorBlockProps) {
  const t = useTranslations('blocks.aiTutor');
  const common = useTranslations('common');
  const safeData = data ?? { greeting: '', qa_pairs: [] };

  const initialMessages = useMemo<AiTutorMessage[]>(
    () => [
      {
        id: createMessageId('greeting'),
        role: 'assistant',
        kind: 'greeting',
        text: safeData.greeting,
      },
      ...safeData.qa_pairs.map((pair) => ({
        id: createMessageId('qa'),
        role: 'assistant' as const,
        kind: 'answer' as const,
        text: `Q: ${pair.question}\n${pair.answer}`,
      })),
    ],
    [safeData.greeting, safeData.qa_pairs]
  );

  const [messages, setMessages] = useState<AiTutorMessage[]>(initialMessages);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const canSubmit = question.trim().length >= 3 && !isLoading && !isRateLimited;

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim();
    if (!canSubmit || trimmedQuestion.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    const userMessage: AiTutorMessage = {
      id: createMessageId('user'),
      role: 'user',
      kind: 'question',
      text: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');

    try {
      const response = await fetch('/api/ai-tutor/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subtopicId,
          question: trimmedQuestion,
          difficulty,
        }),
      });

      if (response.status === 429) {
        setIsRateLimited(true);
        setMessages((current) => [
          ...current,
          {
            id: createMessageId('system'),
            role: 'system',
            kind: 'warning',
            text: t('rateLimitMessage'),
          },
        ]);
        return;
      }

      if (response.ok === false) {
        throw new Error('Unable to connect. Try again.');
      }

      const payload = (await response.json()) as AiTutorQueryResponse;
      if (payload.source === 'qa_pairs' && typeof payload.answer === 'string') {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId('answer'),
            role: 'assistant',
            kind: 'answer',
            text: payload.answer || t('noResults'),
          },
        ]);
        return;
      }

      const chunks = payload.chunks ?? [];
      setMessages((current) => [
        ...current,
        {
          id: createMessageId('chunks'),
          role: 'assistant',
          kind: 'chunks',
          chunks: chunks.map((chunk) => ({ blockType: chunk.blockType, content: chunk.content })),
          text: chunks.length > 0 ? t('relevantBlocks') : t('noResults'),
        },
      ]);
    } catch {
      setErrorMessage(t('networkError'));
      setMessages((current) => [
        ...current,
        {
          id: createMessageId('error'),
          role: 'system',
          kind: 'error',
          text: t('networkError'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="AI" title={t('title')} accentColor={theme.blockAITutorHeader} badge={common('chat')} headingId="block-ai_tutor-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--design-content-surface-soft)', marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: theme.blockAITutorHeader }}>{safeData.greeting}</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--block-text-secondary)' }}>
            {t('askPrompt', { subtopicName })}
          </div>
        </div>

        <div role="log" aria-live="polite" style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          {messages.map((message) => {
            if (message.kind === 'greeting' || message.kind === 'answer') {
              return (
                <div
                  key={message.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--design-content-surface-soft)',
                    border: 'var(--design-content-border)',
                    boxShadow: 'var(--design-content-shadow)',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockAITutorHeader, marginBottom: 4 }}>
                    {message.kind === 'greeting' ? t('title') : t('assistant')}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-secondary)', whiteSpace: 'pre-wrap' }}>{message.text}</div>
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
                    borderRadius: 12,
                    background: 'rgba(61, 90, 158, 0.12)',
                    border: '1px solid rgba(61, 90, 158, 0.2)',
                    boxShadow: 'var(--design-content-shadow)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: theme.blockAITutorHeader, marginBottom: 4 }}>{t('you')}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-primary)' }}>{message.text}</div>
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
                    borderRadius: 12,
                    background: message.kind === 'error' ? 'rgba(198, 40, 40, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(198, 40, 40, 0.15)',
                    color: message.kind === 'error' ? '#991b1b' : '#92400e',
                    boxShadow: 'var(--design-content-shadow)',
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
                    borderRadius: 12,
                    background: 'var(--design-content-surface-soft)',
                    border: 'var(--design-content-border)',
                    boxShadow: 'var(--design-content-shadow)',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockAITutorHeader, marginBottom: 8 }}>
                    {t('assistant')}
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-secondary)' }}>{message.text}</div>
                    {message.chunks.map((chunk: { blockType: string; content: string }) => (
                      <div
                        key={`${message.id}-${chunk.blockType}`}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: 'var(--design-content-surface)',
                          border: 'var(--design-content-border)',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: theme.blockAITutorHeader, marginBottom: 4 }}>
                          {chunk.blockType}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-primary)' }}>{chunk.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
          {isLoading ? (
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

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockAITutorHeader }}>{common('askTheTutor')}</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.shiftKey === false) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            rows={4}
            disabled={isLoading || isRateLimited}
            placeholder={t('askPrompt', { subtopicName })}
            style={{
              width: '100%',
              resize: 'vertical',
              borderRadius: 12,
              border: 'var(--design-content-border)',
              padding: 12,
              font: 'inherit',
              background: 'var(--design-content-surface)',
              color: 'var(--block-text-primary)',
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit}
          style={{
            marginTop: 12,
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            background: theme.blockAITutorHeader,
            color: '#fff',
            opacity: canSubmit ? 1 : 0.7,
            fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {common('sendQuestion')}
        </button>

        {errorMessage ? (
          <div role="alert" style={{ marginTop: 12, color: '#991b1b', fontSize: 13, fontWeight: 700 }}>
            {errorMessage}
          </div>
        ) : null}
        <style jsx>{`
          @keyframes rth-dot-bounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.45;
            }
            40% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </section>
  );
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
