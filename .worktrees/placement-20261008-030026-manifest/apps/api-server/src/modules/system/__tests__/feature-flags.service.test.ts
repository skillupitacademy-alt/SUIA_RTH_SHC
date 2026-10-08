import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { FeatureFlagService } from '../feature-flags.service';

describe('FeatureFlagService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('returns empty flags when FEATURE_FLAGS is missing or empty', () => {
    delete process.env.FEATURE_FLAGS;
    const service = new FeatureFlagService();

    expect(service.getAllFlags()).toEqual({});
    expect(service.isEnabled('ANY_FLAG' as any)).toBe(false);

    process.env.FEATURE_FLAGS = '   ';
    service.refresh();
    expect(service.getAllFlags()).toEqual({});
  });

  it('parses JSON feature flags when provided', () => {
    process.env.FEATURE_FLAGS = '{"FLAG_A":true,"FLAG_B":false}';
    const service = new FeatureFlagService();

    expect(service.isEnabled('FLAG_A' as any)).toBe(true);
    expect(service.isEnabled('FLAG_B' as any)).toBe(false);
  });

  it('parses comma-separated flags and ignores blanks', () => {
    process.env.FEATURE_FLAGS = 'foo, bar , ,baz';
    const service = new FeatureFlagService();

    const flags = service.getAllFlags();
    expect(flags.FOO).toBe(true);
    expect(flags.BAR).toBe(true);
    expect(flags.BAZ).toBe(true);
    expect(Object.keys(flags).every((key) => key.length > 0)).toBe(true);
  });

  it('handles invalid JSON by resetting flags and logging error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.FEATURE_FLAGS = '{bad-json';

    const service = new FeatureFlagService();

    expect(service.getAllFlags()).toEqual({});
    expect(errorSpy).toHaveBeenCalled();
  });

  it('refreshes flags on each public read', () => {
    process.env.FEATURE_FLAGS = '{"FLAG_A":true}';
    const service = new FeatureFlagService();

    process.env.FEATURE_FLAGS = '{"FLAG_A":false,"FLAG_B":true}';

    expect(service.isEnabled('FLAG_A' as any)).toBe(false);
    expect(service.getAllFlags()).toEqual({ FLAG_A: false, FLAG_B: true });
  });
});
