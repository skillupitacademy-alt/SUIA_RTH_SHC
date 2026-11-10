/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import UsersPage from '../page';
import UserDetailPage from '../[userId]/page';
import SubscriptionsPage from '../../subscriptions/page';
import SubscriptionDetailPage from '../../subscriptions/[id]/page';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each([
  [UsersPage, 'User management data is currently unavailable.'],
  [UserDetailPage, 'User details are currently unavailable.'],
  [SubscriptionsPage, 'Subscription data is currently unavailable.'],
  [SubscriptionDetailPage, 'Subscription details are currently unavailable.'],
])('does not present prototype management data or actions', (Page, message) => {
  render(<Page />);
  expect(screen.getByText(message)).toBeTruthy();
  expect(screen.queryByText('John Doe')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});
