import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const getQuestions = vi.hoisted(() => vi.fn());
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: { getQuestions } } }));
vi.mock('@quiz/ui', () => ({ useDebounce: (v: string) => v, ZLoader: () => null, ZPagination: () => null }));
vi.mock('@/components/entry/CascadingSelect', () => ({ CascadingSelect: () => null }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
vi.mock('../QuestionReviewCard', () => ({ QuestionReviewCard: ({ question }: { question: { id: string; createdAt?: string } }) => <div>{question.id}: {question.createdAt ?? 'Unknown'}</div> }));
import { QuestionTable } from '../QuestionTable';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); getQuestions.mockReset(); });
it('preserves server creation timestamps and does not invent missing ones', async () => {
  getQuestions.mockResolvedValue({ questions: [{ id: 'missing', questionText: 'First' }, { id: 'known', questionText: 'Second', createdAt: '2020-01-01T00:00:00Z' }], total: 2 });
  render(<QuestionTable />);
  expect(await screen.findByText('missing: Unknown')).toBeTruthy();
  expect(screen.getByText('known: 2020-01-01T00:00:00Z')).toBeTruthy();
});

it.each([undefined, '   '])('rejects a question page with an absent or blank resource ID', async (id) => {
  getQuestions.mockResolvedValue({ questions: [{ id, questionText: 'Unidentified' }], total: 1 });
  render(<QuestionTable />);
  expect(await screen.findByText(/Question response is missing a valid identifier/)).toBeTruthy();
  expect(screen.queryByText(/q-0/)).toBeNull();
});
