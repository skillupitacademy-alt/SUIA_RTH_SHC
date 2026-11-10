/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { getTopics, deleteTopic } = vi.hoisted(() => ({ getTopics: vi.fn(), deleteTopic: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: { getTopics, deleteTopic } } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, useDebounce: (v: string) => v, ZLoader: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/entry/SelectionFields', () => ({ SelectField: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/components/ui/alert-dialog', () => { const Wrap = ({ children }: { children: React.ReactNode }) => <div>{children}</div>; const Action = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>; return { AlertDialog: Wrap, AlertDialogAction: Action, AlertDialogCancel: Wrap, AlertDialogContent: Wrap, AlertDialogDescription: Wrap, AlertDialogTitle: Wrap }; });
vi.mock('@/hooks/useAdminHierarchy', () => ({ useDomains: () => ({ data: [] }), useSubjects: () => ({ data: [] }) }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
import { TopicTable } from '../TopicTable';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); getTopics.mockReset(); });
it('retains a valid stored topic', async () => {
  getTopics.mockResolvedValue({ data: [{ id: 'real-id', name: 'Stored topic', subjectId: 'subject' }], total: 1 });
  render(<TopicTable />);
  expect(await screen.findByText('Stored topic')).toBeTruthy();
});
it.each([[{ name: 'Missing' }], [{ id: ' ', name: 'Blank' }], [{ id: 'same', name: 'First' }, { id: 'same', name: 'Second' }]])('rejects invalid topic identities', async (...data) => {
  getTopics.mockResolvedValue({ data, total: data.length });
  render(<TopicTable />);
  expect(await screen.findByText('Connection Error: Unable to load topics at this time.')).toBeTruthy();
  expect(screen.queryByText('Missing')).toBeNull();
  expect(screen.queryByText('Blank')).toBeNull();
  expect(screen.queryByText('First')).toBeNull();
});

it('reports a failed topic delete without inventing a cause', async () => {
  getTopics.mockResolvedValue({ data: [{ id: 'real-id', name: 'Stored topic', subjectId: 'subject' }], total: 1 });
  deleteTopic.mockRejectedValue(new Error('transport failure'));
  render(<TopicTable />);
  const row = (await screen.findByText('Stored topic')).closest('tr');
  expect(row).not.toBeNull();
  const button = row!.querySelector('svg.lucide-trash-2')?.closest('button');
  expect(button).toBeTruthy();
  fireEvent.click(button!);
  fireEvent.click(screen.getByText('Delete Forever'));
  expect(await screen.findByText('Unable to delete the topic. Please try again.')).toBeTruthy();
  expect(deleteTopic).toHaveBeenCalledWith('real-id');
});
