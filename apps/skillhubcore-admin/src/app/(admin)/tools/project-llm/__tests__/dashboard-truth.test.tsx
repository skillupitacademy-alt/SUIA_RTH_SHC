import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
import Page from '../page';
afterEach(cleanup);
it('marks unsourced dashboard evidence unavailable and keeps tool navigation', () => {
  render(<Page />);
  expect(screen.getByText(/Workflow status, certification evidence/).textContent).toContain('currently unavailable');
  expect(screen.queryByText('9b7f4c2e3')).toBeNull();
  expect(screen.queryByText('Block Summary S3 certified')).toBeNull();
  expect(screen.getByRole('link', { name: 'Registry' }).getAttribute('href')).toBe('/tools/project-llm/registry');
  expect(screen.getByRole('link', { name: 'Mix & match' }).getAttribute('href')).toBe('/tools/project-llm/mix-match');
});
