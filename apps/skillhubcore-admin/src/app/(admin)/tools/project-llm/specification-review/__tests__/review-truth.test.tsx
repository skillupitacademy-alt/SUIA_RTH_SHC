import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SpecificationReviewPage from '../page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not present local prototype evidence or approval as authoritative', () => {
  render(<SpecificationReviewPage />);
  expect(screen.getByText('Verified specification evidence and approval are currently unavailable.')).toBeTruthy();
  expect(screen.queryByText('VERIFIED')).toBeNull();
  expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
});
