import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FeatureFlagService } from '../feature-flags';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.FEATURE_BFF_QUIZ_HIERARCHY;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('FeatureFlagService', () => {
  it('returns false when env var is absent', () => {
    expect(FeatureFlagService.isEnabled('BFF_QUIZ_HIERARCHY')).toBe(false);
  });

  it('returns true when env var is "true"', () => {
    process.env.FEATURE_BFF_QUIZ_HIERARCHY = 'true';
    expect(FeatureFlagService.isEnabled('BFF_QUIZ_HIERARCHY')).toBe(true);
  });

  it('returns false when env var is "false" or "1"', () => {
    process.env.FEATURE_BFF_QUIZ_HIERARCHY = 'false';
    expect(FeatureFlagService.isEnabled('BFF_QUIZ_HIERARCHY')).toBe(false);

    process.env.FEATURE_BFF_QUIZ_HIERARCHY = '1';
    expect(FeatureFlagService.isEnabled('BFF_QUIZ_HIERARCHY')).toBe(false);
  });
});
