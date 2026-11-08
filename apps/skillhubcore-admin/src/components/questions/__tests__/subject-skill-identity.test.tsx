import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ getSubjects: vi.fn(), getSkills: vi.fn(), deleteSubject: vi.fn(), deleteSkill: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: api } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, ZLoader: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/content/HierarchyFactoryWizard', () => ({ HierarchyFactoryWizard: () => null }));
vi.mock('@/components/entry/SelectionFields', () => ({ SelectField: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/components/ui/alert-dialog', () => { const Wrap = ({ children }: { children: React.ReactNode }) => <div>{children}</div>; const Action = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>; return { AlertDialog: Wrap, AlertDialogAction: Action, AlertDialogCancel: Wrap, AlertDialogContent: Wrap, AlertDialogDescription: Wrap, AlertDialogTitle: Wrap }; });
vi.mock('@/hooks/useAdminHierarchy', () => ({ useDomains: () => ({ data: [] }) }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
vi.mock('../SubjectReviewCard', () => ({ SubjectReviewCard: ({ subject, onDeleteRequest }: { subject: { name: string }; onDeleteRequest: (x: unknown) => void }) => <button onClick={() => onDeleteRequest(subject)}>{subject.name}</button> }));
vi.mock('../SkillReviewCard', () => ({ SkillReviewCard: ({ skill, onDeleteRequest }: { skill: { name: string }; onDeleteRequest: (x: unknown) => void }) => <button onClick={() => onDeleteRequest(skill)}>{skill.name}</button> }));
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

it.each([
  [SubjectTable, api.getSubjects, api.deleteSubject, 'subject'],
  [SkillTable, api.getSkills, api.deleteSkill, 'skill'],
])('reports failed %s deletion without inventing a dependency cause', async (Table, getRows, deleteRow, kind) => {
  getRows.mockResolvedValue({ data: [{ id: 'real-id', name: 'Stored record' }], total: 1 });
  deleteRow.mockRejectedValue(new Error('transport failure'));
  render(<Table />);
  fireEvent.click(await screen.findByText('Stored record'));
  fireEvent.click(screen.getByText('Delete Forever'));
  expect(await screen.findByText(`Unable to delete the ${kind}. Please try again.`)).toBeTruthy();
  expect(deleteRow).toHaveBeenCalledWith('real-id');
});
