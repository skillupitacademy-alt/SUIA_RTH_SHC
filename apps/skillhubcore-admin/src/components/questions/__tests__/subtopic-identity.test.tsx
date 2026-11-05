import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { getSubtopics, deleteSubtopic } = vi.hoisted(() => ({ getSubtopics: vi.fn(), deleteSubtopic: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: { getSubtopics, deleteSubtopic } } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/content/HierarchyFactoryWizard', () => ({ HierarchyFactoryWizard: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/hooks/useAdminHierarchy', () => ({ useDomains: () => ({ data: [] }), useSubjects: () => ({ data: [] }), useTopics: () => ({ data: [] }) }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
import { SubtopicTable } from '../SubtopicTable';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); getSubtopics.mockReset(); });
it('preserves a valid stored subtopic identity', async () => {
  getSubtopics.mockResolvedValue({ data: [{ id: 'real-id', name: 'Stored subtopic' }], total: 1 });
  render(<SubtopicTable />);
  expect(await screen.findByText('Stored subtopic')).toBeTruthy();
});
it.each([[{ name: 'Missing ID' }], [{ id: ' ', name: 'Blank ID' }], [{ id: 'duplicate', name: 'First' }, { id: 'duplicate', name: 'Second' }]])('does not offer actions for invalid identities', async (...data) => {
  getSubtopics.mockResolvedValue({ data, total: data.length });
  render(<SubtopicTable />);
  expect(await screen.findByText('Connection Error: Unable to load subtopics at this time.')).toBeTruthy();
  expect(screen.queryByText('Missing ID')).toBeNull();
  expect(screen.queryByText('Blank ID')).toBeNull();
  expect(screen.queryByText('First')).toBeNull();
});

it('reports a failed subtopic delete without inventing a cause', async () => {
  getSubtopics.mockResolvedValue({ data: [{ id: 'real-id', name: 'Stored subtopic', subjectId: 'subject' }], total: 1 });
  deleteSubtopic.mockRejectedValue(new Error('transport failure'));
  render(<SubtopicTable />);
  const row = (await screen.findByText('Stored subtopic')).closest('tr');
  expect(row).not.toBeNull();
  const button = row!.querySelector('svg.lucide-trash-2')?.closest('button');
  expect(button).toBeTruthy();
  fireEvent.click(button!);

  expect(await screen.findByText('Unable to delete the subtopic. Please try again.')).toBeTruthy();
  expect(deleteSubtopic).toHaveBeenCalledWith('real-id');
});
