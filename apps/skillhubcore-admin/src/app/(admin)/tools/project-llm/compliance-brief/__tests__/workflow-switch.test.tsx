import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ workflowId: 'A', get: vi.fn(), write: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => state.workflowId }) }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('../../context/ProjectLlmContext', () => ({ useProjectLlm: () => ({ state: { familyName: 'Introduction', targetVersion: 'I7' } }) }));
vi.mock('../../components/ProjectLlmStepper', () => ({ ProjectLlmStepper: () => null }));
vi.mock('../../components/ProjectLlmContextBanner', () => ({ ProjectLlmContextBanner: () => null }));
vi.mock('@/lib/project-llm/api/projectLlmClient', () => ({ projectLlmClient: { getEngineeringContract: state.get } }));
import Page from '../page';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); state.get.mockReset(); state.write.mockReset(); state.workflowId = 'A'; });
it('does not copy workflow A contract after switching to workflow B', async () => {
  let resolveA!: (value: unknown) => void;
  let resolveB!: (value: unknown) => void;
  state.get.mockImplementation((id: string) => new Promise((resolve) => { if (id === 'A') resolveA = resolve; else resolveB = resolve; }));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: state.write } });
  const view = render(<Page />);
  await waitFor(() => expect(state.get).toHaveBeenCalledWith('A'));
  state.workflowId = 'B'; view.rerender(<Page />);
  await waitFor(() => expect(state.get).toHaveBeenCalledWith('B'));
  expect((screen.getByRole('button', { name: /Copy Full Brief/ }) as HTMLButtonElement).disabled).toBe(true);
  resolveB({ contract_hash: 'B_HASH', target: { family: 'B_FAMILY', version: 'B1' } });
  await waitFor(() => expect((screen.getByRole('button', { name: /Copy Full Brief/ }) as HTMLButtonElement).disabled).toBe(false));
  resolveA({ contract_hash: 'A_HASH', target: { family: 'A_FAMILY', version: 'A1' } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  fireEvent.click(screen.getByRole('button', { name: /Copy Full Brief/ }));
  expect(state.write).toHaveBeenCalledWith(expect.stringContaining('B_HASH'));
  expect(state.write.mock.calls[0][0]).not.toContain('A_HASH');
});

it('keeps copy disabled when the current contract is unavailable', async () => {
  state.get.mockRejectedValue(new Error('unavailable'));
  render(<Page />);
  await waitFor(() => expect(state.get).toHaveBeenCalledWith('A'));
  await waitFor(() => expect((screen.getByRole('button', { name: /Copy Full Brief/ }) as HTMLButtonElement).disabled).toBe(true));
  expect(state.write).not.toHaveBeenCalled();
});

it('labels static requirements as reference rather than gate evidence', () => {
  state.get.mockReturnValue(new Promise(() => {}));
  render(<Page />);
  expect(screen.getByText(/Static reference material/)).toBeTruthy();
  expect(screen.queryByText('Enforced by Gate')).toBeNull();
  expect(screen.queryByText('Mandatory Contract')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /View as Checklist/ }));
  expect(screen.queryByText('Mandatory Contract')).toBeNull();
});
