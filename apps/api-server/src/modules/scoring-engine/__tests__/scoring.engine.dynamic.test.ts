import { describe, it, expect } from 'vitest';

import { dynamic } from '../scoring.engine';

describe('scoring engine dynamic export', () => {
  it('exposes next.js dynamic flag', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
