import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ExamSummaryReport from '../ExamSummaryReport';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const brand = { primaryColor: '#123456', secondaryColor: '#654321' } as never;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('renders zero values without fabricated fallback metrics', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed', score: 0, total: 0, percentage: 0, percentile: 0, totalTimeSpentSeconds: 0, questions: [], performance: { skill: [] } })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect((await screen.findAllByText('0.0%')).length).toBeGreaterThan(0);
  expect(screen.getByText('0%')).toBeTruthy();
  expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
  expect(screen.queryByText('May 24, 2025')).toBeNull();
  expect(screen.queryByText('Problem Solving')).toBeNull();
});
it('shows an error when result retrieval fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Error Loading Results')).toBeTruthy();
});

it('renders persisted result values and labels absent details unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed', score: 7, total: 10, percentage: 70, statusLabel: 'passed', percentile: 44, lineage: { subject: 'Stored Subject' } })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Stored Subject')).toBeTruthy();
  expect(screen.getByText('Question details unavailable')).toBeTruthy();
  expect(screen.getByText('Difficulty performance unavailable')).toBeTruthy();
  expect(screen.getByText('44%')).toBeTruthy();
});

it('does not treat a missing score as a measured zero', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed' })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Result data unavailable')).toBeTruthy();
});

it('uses aggregate values and marks partial question details unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed', score: 2, total: 4, percentage: 50, statusLabel: null, questions: [{ id: '1', userAnswer: 'A', isCorrect: true }] })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Question details unavailable')).toBeTruthy();
  expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  expect(screen.getByText('/ 4')).toBeTruthy();
  expect(screen.queryByText('RETRY')).toBeNull();
});
it('does not report a measured incorrect count for unevaluated answers', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed', score: 0, total: 1, percentage: 0, questions: [{ id: '1', userAnswer: 'A', isCorrect: null }] })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Incorrect: Unavailable')).toBeTruthy();
  expect(screen.getByText('Skipped: 0')).toBeTruthy();
});
it('derives incorrect and skipped counts only from complete known answers', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'completed', score: 0, total: 2, percentage: 0, statusLabel: 'failed', questions: [{ id: '1', userAnswer: 'A', isCorrect: false }, { id: '2', userAnswer: null, isCorrect: null }] })));
  render(<ExamSummaryReport brand={brand} examId="exam" />);
  expect(await screen.findByText('Incorrect: 1')).toBeTruthy();
  expect(screen.getByText('Skipped: 1')).toBeTruthy();
  expect(screen.getAllByText('RETRY').length).toBeGreaterThan(0);
});
