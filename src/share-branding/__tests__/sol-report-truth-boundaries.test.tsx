import React from 'react';
import { cleanup, render, screen, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ExamSummaryReport from '../ExamSummaryReport';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const brand = { primaryColor: '#123456', secondaryColor: '#654321' } as never;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('hides a previous exam result while the next exam response is pending', async () => {
  let release!: (response: Response) => void;
  const pending = new Promise<Response>(resolve => { release = resolve; });
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(Response.json({
      status: 'completed', score: 1, total: 1, percentage: 100,
      lineage: { subject: 'Previous exam subject' },
    }))
    .mockReturnValueOnce(pending));

  const view = render(<ExamSummaryReport brand={brand} examId="exam-a" />);
  expect(await screen.findByText('Previous exam subject')).toBeTruthy();
  await act(async () => {
    view.rerender(<ExamSummaryReport brand={brand} examId="exam-b" />);
  });
  const previousResultStillVisible = screen.queryByText('Previous exam subject') !== null;
  await act(async () => {
    release(Response.json({
      status: 'completed', score: 0, total: 1, percentage: 0,
      lineage: { subject: 'Current exam subject' },
    }));
    await pending;
  });
  expect(await screen.findByText('Current exam subject')).toBeTruthy();
  expect(previousResultStillVisible).toBe(false);
});
