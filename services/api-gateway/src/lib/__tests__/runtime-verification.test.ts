/**
 * PHASE 7K STAGE 1.10 - RUNTIME VERIFICATION
 *
 * This test verifies what the ACTUAL RUNNING resolver returns.
 * This is the SAME resolver that the Gateway uses at runtime.
 */

import { describe, expect, it } from 'vitest';
import { resolveBrandFromHostname } from '../brand-resolution';

describe('Stage 1.10: Runtime Resolver Verification', () => {
  it('LOCAL: skillhubcore.localhost → ?', () => {
    const result = resolveBrandFromHostname('skillhubcore.localhost');
    console.log('Runtime result for skillhubcore.localhost:', result);
    expect(result).toBe('skillhubcore');
  });

  it('PRODUCTION: admin.skillhubcore.in → ?', () => {
    const result = resolveBrandFromHostname('admin.skillhubcore.in');
    console.log('Runtime result for admin.skillhubcore.in:', result);
    expect(result).toBe('skillhubcore');
  });

  it('PRODUCTION: skillhubcore.in → ?', () => {
    const result = resolveBrandFromHostname('skillhubcore.in');
    console.log('Runtime result for skillhubcore.in:', result);
    expect(result).toBe('skillhubcore');
  });

  it('OPTIONAL: admin.skillhubcore.localhost → ?', () => {
    const result = resolveBrandFromHostname('admin.skillhubcore.localhost');
    console.log('Runtime result for admin.skillhubcore.localhost:', result);
    expect(result).toBe('skillhubcore');
  });

  it('GATEWAY INFRASTRUCTURE: 127.0.0.1 → ?', () => {
    const result = resolveBrandFromHostname('127.0.0.1');
    console.log('Runtime result for 127.0.0.1:', result);
    expect(result).toBeUndefined();
  });
});
