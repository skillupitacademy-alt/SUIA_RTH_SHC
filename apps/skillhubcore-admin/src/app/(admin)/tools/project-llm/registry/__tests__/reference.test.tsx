import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('@/lib/project-llm', () => ({ BLOCK_CORPUS_REGISTRY: { families: [
  { familyId: 'I', familyName: 'Introduction', documentedVersions: ['I1'], hasVerifiedImplementation: true },
  { familyId: 'O', familyName: 'Objective', documentedVersions: ['O1'], hasVerifiedImplementation: false },
] } }));
import Page from '../page';
afterEach(cleanup);
it('identifies fixture classifications without asserting runtime status and retains filtering', () => {
  render(<Page />);
  expect(screen.getByText(/Runtime registration and verification are not established/)).toBeTruthy();
  expect(screen.queryByText('RUNTIME ACTIVE')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Fixture marked integrated/ }));
  expect(screen.getByText('Introduction')).toBeTruthy();
  expect(screen.queryByText('Objective')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Other fixture entries/ }));
  expect(screen.getByText('Objective')).toBeTruthy();
  expect(screen.queryByText('Introduction')).toBeNull();
});
