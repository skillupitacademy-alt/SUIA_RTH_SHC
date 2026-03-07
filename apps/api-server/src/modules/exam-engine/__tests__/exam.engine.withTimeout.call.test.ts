import { describe, it, expect } from 'vitest';

import { __withTimeout } from '../exam.engine';

describe('exam.engine __withTimeout', () => {
  it('resolves the passthrough fallback', async () => {
    const result = await __withTimeout(Promise.resolve('ok'));
    expect(result).toBe('ok');
  });
});
