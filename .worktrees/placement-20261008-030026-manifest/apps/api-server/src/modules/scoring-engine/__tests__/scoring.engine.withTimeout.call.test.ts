import { describe, it, expect } from 'vitest';

import { __withTimeout } from '../scoring.engine';

describe('scoring.engine __withTimeout', () => {
  it('falls back to passthrough', async () => {
    const res = await __withTimeout(Promise.resolve('score'));
    expect(res).toBe('score');
  });
});
