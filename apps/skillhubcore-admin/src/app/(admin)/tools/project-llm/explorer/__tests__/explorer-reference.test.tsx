import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/project-llm', () => ({ BLOCK_CORPUS_REGISTRY: { families: [{ familyId: 'I', familyName: 'Introduction', documentedVersions: ['I1', 'I2'] }] } }));
import FamilyVersionExplorerPage from '../page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('identifies static descriptions as reference instead of verified evidence', () => {
  render(<FamilyVersionExplorerPage />);
  expect(screen.getByText('Reference descriptions only; they do not verify runtime behavior or authorize governance actions.')).toBeTruthy();
  expect(screen.queryByText('VERIFIED')).toBeNull();
  expect(screen.getByText('REFERENCE ONLY')).toBeTruthy();
});
