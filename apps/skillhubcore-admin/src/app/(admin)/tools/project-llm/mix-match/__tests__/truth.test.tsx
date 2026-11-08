import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/project-llm', () => ({ BLOCK_CORPUS_REGISTRY: { families: [{ familyId: 'I', familyName: 'Introduction', documentedVersions: ['I1', 'I2', 'I5'] }] } }));
import Page from '../page';
afterEach(() => { cleanup(); push.mockReset(); });
it('discloses unavailable evidence and navigates only to the review page', () => {
  render(<Page />);
  expect(screen.getByText('Compatibility evidence unavailable')).toBeTruthy();
  expect(screen.getByText(/have not been verified here/)).toBeTruthy();
  expect(screen.queryByText('Real-time validation against Project LLM architectural guardrails.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Open specification review/ }));
  expect(push).toHaveBeenCalledWith('/tools/project-llm/specification-review?family=I&version=I7&sources=I1,I2,I5');
});
it('retains the two-pattern selection threshold', () => {
  render(<Page />);
  for (const name of ['Topic Orientation & Domain Badge', 'Problem Framing Statement', 'Need & Motivation Proof', 'Industry Real-World Scenario']) fireEvent.click(screen.getByText(name));
  expect((screen.getByRole('button', { name: /Open specification review/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(push).not.toHaveBeenCalled();
});
