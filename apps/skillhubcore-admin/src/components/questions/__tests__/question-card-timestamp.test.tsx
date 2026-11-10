/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
import { QuestionReviewCard } from '../QuestionReviewCard';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each([undefined, '', 'invalid'])('renders unknown for missing or invalid creation time', (createdAt) => {
  render(<QuestionReviewCard question={{ id: 'id', questionText: 'Question', createdAt }} index={0} onDeleteRequest={() => {}} />);
  expect(screen.getByText('Created unknown')).toBeTruthy();
  expect(screen.queryByText('Created Recently')).toBeNull();
});
it('retains a valid creation timestamp display', () => {
  render(<QuestionReviewCard question={{ id: 'id', questionText: 'Question', createdAt: '2020-01-01T00:00:00Z' }} index={0} onDeleteRequest={() => {}} />);
  expect(screen.getByText(/^Created .* ago$/)).toBeTruthy();
});
