import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ getDomains: vi.fn(), deleteDomain: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: api } }));
vi.mock('@quiz/ui', () => ({ HierarchySearchBar: () => null, ZLoader: () => null, ZPagination: () => null, ZPortalModal: () => null }));
vi.mock('@/components/content/HierarchyFactoryWizard', () => ({ HierarchyFactoryWizard: () => null }));
vi.mock('@/components/entry/SelectionFields', () => ({ SelectField: () => null }));
vi.mock('@/components/layout/ErrorBanner', () => ({ ErrorBanner: ({ message }: { message: string }) => <div>{message}</div> }));
vi.mock('@/components/ui/alert-dialog', () => {
  const Wrap = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const Button = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>;
  return { AlertDialog: Wrap, AlertDialogAction: Button, AlertDialogCancel: Button, AlertDialogContent: Wrap, AlertDialogDescription: Wrap, AlertDialogTitle: Wrap };
});
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
vi.mock('../DomainReviewCard', () => ({ DomainReviewCard: ({ domain, onDeleteRequest }: { domain: unknown; onDeleteRequest: (x: unknown) => void }) => <button onClick={() => onDeleteRequest(domain)}>Select domain for deletion</button> }));
import { DomainTable } from '../DomainTable';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
it('does not invent a dependency conflict when a delete request fails', async () => {
  api.getDomains.mockResolvedValue({ data: [{ id: 'domain-1', name: 'Stored' }], total: 1 });
  api.deleteDomain.mockRejectedValue(new Error('network failure'));
  render(<DomainTable />);
  fireEvent.click(await screen.findByText('Select domain for deletion'));
  fireEvent.click(screen.getByText('Delete Forever'));
  expect(await screen.findByText('Unable to delete the domain. Please try again.')).toBeTruthy();
  expect(screen.queryByText(/linked to active subjects/)).toBeNull();
  expect(api.deleteDomain).toHaveBeenCalledWith('domain-1');
});

it.each([[{ name: 'Missing' }], [{ id: ' ', name: 'Blank' }], [{ id: 'same', name: 'First' }, { id: 'same', name: 'Second' }]])('rejects invalid domain resource identities', async (...data) => {
  api.getDomains.mockResolvedValue({ data, total: data.length });
  render(<DomainTable />);
  expect(await screen.findByText('Connection Error: Unable to load the domain catalog at this time.')).toBeTruthy();
  expect(screen.queryByText('Select domain for deletion')).toBeNull();
});
