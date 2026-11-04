import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ getSubjects: vi.fn(), getSkills: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: api } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, ZLoader: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/content/HierarchyFactoryWizard', () => ({ HierarchyFactoryWizard: () => null }));
vi.mock('@/components/entry/SelectionFields', () => ({ SelectField: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/components/ui/alert-dialog', () => { const Wrap = ({ children }: { children: React.ReactNode }) => <div>{children}</div>; return { AlertDialog: Wrap, AlertDialogAction: Wrap, AlertDialogCancel: Wrap, AlertDialogContent: Wrap, AlertDialogDescription: Wrap, AlertDialogTitle: Wrap }; });
vi.mock('@/hooks/useAdminHierarchy', () => ({ useDomains: () => ({ data: [] }) }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
vi.mock('../SubjectReviewCard', () => ({ SubjectReviewCard: ({ subject }: { subject: { name: string } }) => <div>{subject.name}</div> }));
vi.mock('../SkillReviewCard', () => ({ SkillReviewCard: ({ skill }: { skill: { name: string } }) => <div>{skill.name}</div> }));
import { SubjectTable } from '../SubjectTable';
import { SkillTable } from '../SkillTable';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
it.each([[SubjectTable, api.getSubjects, 'Stored subject'], [SkillTable, api.getSkills, 'Stored skill']])('retains valid resource identities', async (Table, getRows, name) => {
  getRows.mockResolvedValue({ data: [{ id: 'real-id', name }], total: 1 });
  render(<Table />);
  expect(await screen.findByText(name)).toBeTruthy();
});
it.each([[SubjectTable, api.getSubjects, 'Connection Error: Unable to load subjects.'], [SkillTable, api.getSkills, 'Connection Error: Unable to load skills at this time.']])('rejects missing identities', async (Table, getRows, message) => {
  getRows.mockResolvedValue({ data: [{ name: 'Missing identity' }], total: 1 });
  render(<Table />);
  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByText('Missing identity')).toBeNull();
});

it.each([[SubjectTable, api.getSubjects, 'Connection Error: Unable to load subjects.'], [SkillTable, api.getSkills, 'Connection Error: Unable to load skills at this time.']])('rejects duplicate identities', async (Table, getRows, message) => {
  getRows.mockResolvedValue({ data: [{ id: 'same', name: 'First' }, { id: 'same', name: 'Second' }], total: 2 });
  render(<Table />);
  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByText('First')).toBeNull();
});

it.each([[SubjectTable, api.getSubjects, 'Connection Error: Unable to load subjects.'], [SkillTable, api.getSkills, 'Connection Error: Unable to load skills at this time.']])('rejects blank identities', async (Table, getRows, message) => {
  getRows.mockResolvedValue({ data: [{ id: ' ', name: 'Blank identity' }], total: 1 });
  render(<Table />);
  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByText('Blank identity')).toBeNull();
});
