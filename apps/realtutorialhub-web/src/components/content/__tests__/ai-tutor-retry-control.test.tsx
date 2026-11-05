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
it('cancels its retry timer on unmount', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '30' } })));
  const view = render(<AITutorBlock data={{ greeting: 'Hello', qa_pairs: [] }} theme={{ blockAITutor: '', blockAITutorHeader: '' }} subtopicId="topic" />);
  const input = screen.getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: 'Question' } });
  await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
  expect(input.disabled).toBe(true);
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it('does not send a request when the subtopic identity is missing', async () => {
  vi.stubGlobal('fetch', vi.fn());
  render(<AITutorBlock data={{ greeting: 'Hello', qa_pairs: [] }} theme={{ blockAITutor: '', blockAITutorHeader: '' }} />);
  const input = screen.getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: 'Question' } });
  await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
  expect(fetch).not.toHaveBeenCalled();
});
it('sends the supplied subtopic identity', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ source: 'qa_pairs', answer: 'Answer', chunks: null }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<AITutorBlock data={{ greeting: 'Hello', qa_pairs: [] }} theme={{ blockAITutor: '', blockAITutorHeader: '' }} subtopicId="fixture-subtopic" />);
  const input = screen.getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: 'Question' } });
  await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).subtopicId).toBe('fixture-subtopic');
});
