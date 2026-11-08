import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import FooterBrand from '../FooterBrand';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => {
    throw new Error('Unexpected network request');
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('does not collect emails or claim a nonexistent subscription', () => {
  render(<FooterBrand />);

  // Should show unavailable message
  expect(screen.getByText('Newsletter subscriptions are currently unavailable.')).toBeTruthy();

  // Should show neutral branding without fabricated claims - use custom matcher for split text
  expect(screen.getByText((content, element) => {
    return element?.tagName.toLowerCase() === 'h2' && /Real.*Tutorial.*Hub/i.test(element.textContent || '');
  })).toBeTruthy();
  expect(screen.getByText('Explore our programs and learning resources.')).toBeTruthy();

  // Should NOT show fabricated success metrics
  expect(screen.queryByText(/15,000\+/)).toBeNull();
  expect(screen.queryByText(/successfully launched/)).toBeNull();

  // Should NOT have email input or subscribe button
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
  expect(screen.queryByLabelText(/email/i)).toBeNull();
});
