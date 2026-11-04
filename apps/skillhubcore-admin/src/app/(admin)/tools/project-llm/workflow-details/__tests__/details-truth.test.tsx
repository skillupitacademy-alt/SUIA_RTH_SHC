import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ id: '', load: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => fixture.id || null }) }));
vi.mock('../../context/ProjectLlmContext', () => ({ useProjectLlm: () => ({ state: { workflowId: null } }) }));
vi.mock('@/lib/project-llm/api/projectLlmClient', () => ({ projectLlmClient: { getWorkflowState: fixture.load } }));
import WorkflowDetailsPage from '../page';
beforeEach(() => { fixture.id = ''; fixture.load.mockReset(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not invent evidence when no workflow is selected', () => {
  render(<WorkflowDetailsPage />);
  expect(screen.getByText('Select a workflow to view its status.')).toBeTruthy();
  expect(screen.getByText('Audit history and verification evidence are currently unavailable.')).toBeTruthy();
  expect(fixture.load).not.toHaveBeenCalled();
});
it('renders the returned workflow state without prototype evidence', async () => {
  fixture.id = 'workflow'; fixture.load.mockResolvedValue({ state: 'DISCOVERY' });
  render(<WorkflowDetailsPage />);
  expect(await screen.findByText('Workflow status: DISCOVERY')).toBeTruthy();
  expect(screen.queryByText(/100% test coverage/)).toBeNull();
});
it('shows unavailable when the backend request fails', async () => {
  fixture.id = 'workflow'; fixture.load.mockRejectedValue(new Error('offline'));
  render(<WorkflowDetailsPage />);
  expect((await screen.findByRole('alert')).textContent).toBe('Workflow status is unavailable.');
});

it('ignores an old workflow response after switching workflows', async () => {
  let resolveOld!: (value: { state: string }) => void;
  fixture.id = 'old';
  fixture.load.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce({ state: 'NEW_STATE' });
  const view = render(<WorkflowDetailsPage />);
  fixture.id = 'new';
  view.rerender(<WorkflowDetailsPage />);
  expect(await screen.findByText('Workflow status: NEW_STATE')).toBeTruthy();
  await act(async () => { resolveOld({ state: 'OLD_STATE' }); });
  expect(screen.queryByText('Workflow status: OLD_STATE')).toBeNull();
});
