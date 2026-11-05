import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => 'realtutorialhub' }) }));
vi.mock('@/lib/portal-brand', () => ({ getTutorialPortalBrandDefinition: () => ({ brandName: 'RTH' }), withTutorialPortalBrand: (url: string) => url }));
import RthPage from '../../apps/realtutorialhub-web/src/app/forgot-password/page';
import SkillPage from '../../apps/skillup-web/src/app/forgot-password/page';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each([['RTH', RthPage], ['SkillUp', SkillPage]])('%s acknowledges an OK response without claiming delivery', async (_name, Page) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  render(<Page />);
  fireEvent.change(screen.getByPlaceholderText(/@/), { target: { value: 'learner@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
  expect(await screen.findByText(/delivery is not confirmed/i)).toBeTruthy();
});
it.each([['RTH', RthPage], ['SkillUp', SkillPage]])('%s reports an uncertain outcome for rejected transport or HTTP failure', async (_name, Page) => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response(null, { status: 404 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<Page />);
  fireEvent.change(screen.getByPlaceholderText(/@/), { target: { value: 'learner@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
  expect(await screen.findByText(/Unable to confirm the request/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(await screen.findByText(/Unable to confirm the request/)).toBeTruthy();
  expect(screen.queryByText(/delivery is not confirmed/i)).toBeNull();
});
