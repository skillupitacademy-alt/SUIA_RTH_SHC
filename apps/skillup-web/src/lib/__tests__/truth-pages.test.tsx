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
import StudentDashboardPage from '../../app/student/page';
import AttendancePage from '../../app/student/attendance/page';
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
  expect(screen.getByText('Learning tracks')).toBeTruthy();
  first.unmount();
  render(await FacultyPage());
  expect(screen.getByText('No active faculty are currently available.')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
});

it('distinguishes missing session percentages from measured zero and calls open jobs by their source', async () => {
  const summary = { nextSessionAt: null, paymentDue: 0, outstandingInstallments: 0, attendancePercent: 0, progressPercent: 0, upcomingSessions: 0, placementMatches: 4, facultyName: 'Unavailable', batchName: 'Unavailable', currentTopic: 'Unavailable' };
  fetchData.mockResolvedValueOnce({ summary, sessions: [] }).mockResolvedValueOnce({ summary, sessions: [{ id: 's', date: '2026-01-01T00:00:00Z', title: 'Session', mode: 'online', status: 'completed' }] });
  const first = render(await StudentDashboardPage());
  expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(1);
  expect(screen.getByText('Open jobs')).toBeTruthy();
  expect(screen.queryByText('Job matches')).toBeNull();
  first.unmount();
  render(await StudentDashboardPage());
  expect(screen.getAllByText('0%')).toHaveLength(2);
});

it('distinguishes absent attendance records from measured zero', async () => {
  fetchData.mockResolvedValueOnce({ history: [] }).mockResolvedValueOnce({ history: [{ date: '2026-01-01', state: 'absent', note: 'Details unavailable' }] });
  const first = render(await AttendancePage());
  expect(screen.getByText('Unavailable')).toBeTruthy();
  expect(screen.queryByText('Monthly summary')).toBeNull();
  first.unmount();
  render(await AttendancePage());
  expect(screen.getByText('0%')).toBeTruthy();
  expect(screen.getByText('Details unavailable')).toBeTruthy();
});
