import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@quiz/marketing-site', () => ({ useBrand: () => ({ name: 'Brand' }), useMarketingContent: () => ({ footer: { brand: { studentCount: 'Example' } } }) }));
import FooterBrand from '../FooterBrand';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not collect emails or claim a nonexistent subscription', () => {
  render(<FooterBrand />);
  expect(screen.getByText('Newsletter subscriptions are currently unavailable.')).toBeTruthy();
  expect(screen.getByText('Explore our programs and learning resources.')).toBeTruthy();
  expect(screen.queryByText(/successfully launched/)).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
});
