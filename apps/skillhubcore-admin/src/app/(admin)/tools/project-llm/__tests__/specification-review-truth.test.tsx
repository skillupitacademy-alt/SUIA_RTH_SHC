import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import Page from '../specification-review/page';

afterEach(cleanup);

it('marks unsourced specification verification and approval unavailable', () => {
  render(<Page />);

  // Verify unavailable message is shown
  expect(screen.getByText(/Verified specification evidence and approval are currently unavailable/i)).toBeTruthy();

  // Verify no fabricated VERIFIED or APPROVED claims beyond the unavailable message
  expect(screen.queryByText(/specification.*approved/i)).toBeNull();
  expect(screen.queryByText(/PASS/i)).toBeNull();
  expect(screen.queryByText(/specification.*complete/i)).toBeNull();
});
