import { FeatureFlag, FeatureFlagsMap } from '@quiz/types';

export class FeatureFlagService {
  private flags: FeatureFlagsMap = {};

  constructor() {
    this.refresh();
  }

  /**
   * Refreshes flags from environment variables.
   * Format: FEATURE_FLAGS=FLAG1,FLAG2 or FEATURE_FLAGS={"FLAG1":true,"FLAG2":false}
   */
  public refresh(): void {
    const rawFlags = process.env.FEATURE_FLAGS;
    if (rawFlags === undefined || rawFlags === null || rawFlags.trim() === '') {
      this.flags = {};
      return;
    }

    try {
      // 1. Try parsing as JSON
      if (rawFlags.startsWith('{')) {
        this.flags = JSON.parse(rawFlags) as FeatureFlagsMap;
        return;
      }

      // 2. Fallback to comma-separated list
      const enabledFlags = rawFlags.split(',').map(f => f.trim().toUpperCase());
      this.flags = enabledFlags.reduce((acc, flag) => {
        if (flag) {
          acc[flag as FeatureFlag] = true;
        }
        return acc;
      }, {} as FeatureFlagsMap);

    } catch (error) {
      console.error('[FeatureFlagService] Failed to parse FEATURE_FLAGS:', error);
      this.flags = {};
    }
  }

  public refreshOnRequest(): void {
    this.refresh();
  }

  /**
   * Checks if a specific feature flag is enabled.
   */
  public isEnabled(flag: FeatureFlag): boolean {
    this.refreshOnRequest();
    const value = this.flags[flag];
    return value === true;
  }

  /**
   * Returns all currently active flags.
   */
  public getAllFlags(): FeatureFlagsMap {
    this.refreshOnRequest();
    return { ...this.flags };
  }
}

// Instance for singleton use if needed outside of container (though container is preferred)
export const featureFlags = new FeatureFlagService();
