import { describe, expect, it } from 'vitest';

import {
  subscriptionFeatures,
  subscriptionPlans,
  userFeaturesCache,
} from '../schema';

describe('subscription plans schema', () => {
  it('exports the SkillHubCore subscription tables', () => {
    expect(subscriptionPlans).toBeDefined();
    expect(subscriptionFeatures).toBeDefined();
    expect(userFeaturesCache).toBeDefined();
    const baseNameSymbol = Object.getOwnPropertySymbols(subscriptionPlans).find((symbol) => symbol.description === 'drizzle:BaseName');
    expect(baseNameSymbol).toBeDefined();
    expect((subscriptionPlans as any)[baseNameSymbol as symbol]).toBe('subscription_plans');
  });
});
