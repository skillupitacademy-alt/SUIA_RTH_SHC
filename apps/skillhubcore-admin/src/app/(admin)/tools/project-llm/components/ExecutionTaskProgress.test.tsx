// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ExecutionTaskProgress } from './ExecutionTaskProgress';
import { projectLlmClient } from '@/lib/project-llm/api/projectLlmClient';

vi.mock('@/lib/project-llm/api/projectLlmClient', () => ({
  projectLlmClient: { getExecutionProgress: vi.fn() },
}));

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

it('keeps the build running until the backend advances, irrespective of elapsed time', async () => {
  vi.useFakeTimers();
  const startedAt = Date.now() / 1000;
  vi.mocked(projectLlmClient.getExecutionProgress).mockResolvedValue({
    startedAt, status: 'RUNNING', tasks: [{ label: 'Build admin application', status: 'RUNNING', startedAt }],
  });
  render(<ExecutionTaskProgress workflowId="workflow" operation="composer" active />);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  expect(screen.getByText('Build admin application')).toBeTruthy();
  expect(screen.getByText('Task 1: RUNNING')).toBeTruthy();
  expect(screen.queryByText(/Task 1: DONE/)).toBeNull();
});

it('reports polling failures without inventing task completion', async () => {
  vi.mocked(projectLlmClient.getExecutionProgress).mockRejectedValue(new Error('Unavailable'));
  render(<ExecutionTaskProgress workflowId="workflow" operation="qualification" active />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByRole('status').textContent).toContain('Completion is not confirmed');
  expect(screen.queryByText(/DONE/)).toBeNull();
});
