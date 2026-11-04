import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const getTopics = vi.hoisted(() => vi.fn());
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: { getTopics } } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, useDebounce: (v: string) => v, ZLoader: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/entry/SelectionFields', () => ({ SelectField: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/components/ui/alert-dialog', () => { const Wrap = ({ children }: { children: React.ReactNode }) => <div>{children}</div>; return { AlertDialog: Wrap, AlertDialogAction: Wrap, AlertDialogCancel: Wrap, AlertDialogContent: Wrap, AlertDialogDescription: Wrap, AlertDialogTitle: Wrap }; });
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
