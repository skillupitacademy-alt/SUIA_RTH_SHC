import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fetchData = vi.hoisted(() => vi.fn());
vi.mock('../skillup-api', () => ({ fetchSkillupApi: fetchData }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
import BatchesPage from '../../app/batches/page';
import MyBatchPage from '../../app/student/my-batch/page';
import ProgramsPage from '../../app/programs/page';
import FacultyPage from '../../app/faculty/page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); fetchData.mockReset(); vi.unstubAllGlobals(); });
it('shows no enrollment in both batch entry pages', async () => {
  fetchData.mockResolvedValue({ batch: null, sessions: [] });
  const first = render(await BatchesPage());
  expect(screen.getByText('No active batch enrollment is available.')).toBeTruthy();
  first.unmount();
  render(await MyBatchPage());
  expect(screen.getByText('No active batch enrollment is available.')).toBeTruthy();
});
it('shows empty program and faculty states', async () => {
  fetchData.mockResolvedValueOnce({ programs: [] }).mockResolvedValueOnce({ faculty: [], heroStats: [{ label: 'Active mentors', value: '0' }] });
  const first = render(await ProgramsPage());
  expect(screen.getByText('No programs are currently available.')).toBeTruthy();
  first.unmount();
  render(await FacultyPage());
  expect(screen.getByText('No active faculty are currently available.')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
});
