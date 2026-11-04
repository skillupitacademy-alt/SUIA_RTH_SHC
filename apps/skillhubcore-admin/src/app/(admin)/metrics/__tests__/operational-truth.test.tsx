import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AuditPage from '../../audit/page';
import MetricsPage from '../page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not present prototype audit entries as history', () => {
  render(<AuditPage />);
  expect(screen.getByText('Audit history is currently unavailable.')).toBeTruthy();
  expect(screen.queryByText('Super Admin')).toBeNull();
});
it('does not present hardcoded metrics as operational measurements', () => {
  render(<MetricsPage />);
  expect(screen.getByText('Operational and revenue metrics are currently unavailable.')).toBeTruthy();
  expect(screen.queryByText('12,500')).toBeNull();
});
