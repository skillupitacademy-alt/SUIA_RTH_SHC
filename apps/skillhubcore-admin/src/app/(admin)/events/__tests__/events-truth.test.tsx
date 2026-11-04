import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EventsPage from '../page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('reports that event evidence is unavailable without displaying demo metrics', () => {
  render(<EventsPage />);
  expect(screen.getByText('Event history and delivery metrics are currently unavailable.')).toBeTruthy();
  expect(screen.queryByText('1.8%')).toBeNull();
  expect(screen.queryByText('user.registered')).toBeNull();
});
