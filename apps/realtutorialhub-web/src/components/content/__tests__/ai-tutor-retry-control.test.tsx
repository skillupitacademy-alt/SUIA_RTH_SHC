import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('../BlockHeader', () => ({ BlockHeader: () => null }));
import { AITutorBlock } from '../AITutorBlock';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it('reenables question entry after the server retry interval', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '1' } })));
  render(<AITutorBlock data={{ greeting: 'Hello', qa_pairs: [] }} theme={{ blockAITutor: '', blockAITutorHeader: '' }} subtopicId="11111111-1111-4111-8111-111111111111" />);
  const input = screen.getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: 'Question' } });
  await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
  expect(input.disabled).toBe(true);
  act(() => vi.advanceTimersByTime(1000));
  expect(input.disabled).toBe(false);
});
