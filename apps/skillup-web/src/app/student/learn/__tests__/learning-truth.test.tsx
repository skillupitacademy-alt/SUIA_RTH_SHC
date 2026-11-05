import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
import Page from '../page';
afterEach(cleanup);
it('discloses unavailable learning data and retains batch navigation', () => {
  render(<Page />);
  expect(screen.getByText(/learning path and lesson resources are currently unavailable/i)).toBeTruthy();
  expect(screen.queryByText('React foundations')).toBeNull();
  expect(screen.queryByText('Session recordings')).toBeNull();
  expect(screen.getByRole('link', { name: 'Batch details' }).getAttribute('href')).toBe('/student/my-batch');
});
