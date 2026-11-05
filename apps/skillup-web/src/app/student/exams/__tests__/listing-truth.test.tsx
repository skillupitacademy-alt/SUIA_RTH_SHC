import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
import Page from '../page';
afterEach(cleanup);
it('marks the assessment list unavailable without invented tracks or inert starts', () => {
  render(<Page />);
  expect(screen.getByText(/Assessment availability is currently unavailable/)).toBeTruthy();
  expect(screen.queryByText('Weekly module quiz')).toBeNull();
  expect(screen.queryByRole('button', { name: /Start practice/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'Placement view' }).getAttribute('href')).toBe('https://placement.skillhubcore.in/?brand=skillup');
});
