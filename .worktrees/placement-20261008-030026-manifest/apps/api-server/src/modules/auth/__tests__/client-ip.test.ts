import { describe, expect, it } from 'vitest';

import { getClientIp } from '../client-ip';

describe('getClientIp', () => {
  it('prefers x-forwarded-for', () => {
    expect(getClientIp({
      headers: { get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null },
    })).toBe('1.2.3.4');
  });

  it('falls back to cf-connecting-ip then x-real-ip', () => {
    expect(getClientIp({
      headers: { get: (name: string) => name === 'cf-connecting-ip' ? '2.2.2.2' : null },
    })).toBe('2.2.2.2');

    expect(getClientIp({
      headers: { get: (name: string) => name === 'x-real-ip' ? '3.3.3.3' : null },
    })).toBe('3.3.3.3');
  });

  it('falls back to unknown when no IP headers exist', () => {
    expect(getClientIp({
      headers: { get: () => null },
    })).toBe('unknown');
  });
});
