'use client';

import { useState } from 'react';

type AiTutorChunk = { blockType: string; content: string; score?: number };

type AiTutorResponse =
  | { source: 'qa_pairs'; answer: string | null; chunks: null; questionsRemaining?: number }
  | { source: 'vector_search'; answer: null; chunks: AiTutorChunk[]; questionsRemaining?: number };

type AiTutorMessage =
  | { id: string; role: 'assistant'; kind: 'greeting' | 'answer'; text: string }
  | { id: string; role: 'user'; kind: 'question'; text: string }
  | { id: string; role: 'assistant'; kind: 'chunks'; chunks: AiTutorChunk[]; text: string }
  | { id: string; role: 'system'; kind: 'error' | 'warning'; text: string };

function createMessageId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown } | null;
    if (payload != null) {
      if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error;
      if (typeof payload.message === 'string' && payload.message.length > 0) return payload.message;
    }
  } catch {
    // Fall back to status text.
  }

  return `Request failed with status ${response.status}`;
}

export function useAiTutor(initialGreeting: string, subtopicId: string, subtopicName: string, difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert' = 'simple') {
  const [messages, setMessages] = useState<AiTutorMessage[]>([
    {
      id: createMessageId('greeting'),
      role: 'assistant',
      kind: 'greeting',
      text: initialGreeting,
    },
  ]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState<number | null>(null);

  const canSubmit = question.trim().length >= 3 && !isLoading && !isRateLimited;

  const submitQuestion = async () => {
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
            text: 'You have reached the limit for this subtopic this hour.',
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as AiTutorResponse;
      if (typeof payload.questionsRemaining === 'number') {
        setQuestionsLeft(payload.questionsRemaining);
      }

      if (payload.source === 'qa_pairs' && typeof payload.answer === 'string') {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId('answer'),
            role: 'assistant',
            kind: 'answer',
            text: payload.answer || `I could not find a direct answer for ${subtopicName}.`,
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
          chunks,
          text: chunks.length > 0 ? 'Relevant tutorial notes are listed below.' : 'I could not find matching tutorial notes yet.',
        },
      ]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to connect. Try again.');
      setMessages((current) => [
        ...current,
        {
          id: createMessageId('error'),
          role: 'system',
          kind: 'error',
          text: error instanceof Error ? error.message : 'Unable to connect. Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    question,
    setQuestion,
    isLoading,
    errorMessage,
    isRateLimited,
    questionsLeft,
    canSubmit,
    submitQuestion,
  };
}
