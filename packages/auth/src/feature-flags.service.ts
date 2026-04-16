/**
 * Feature Flags Service
 * Brand-specific feature control implementation
 */

import { 
  type FeatureFlag, 
  type FeatureKey, 
  type Brand, 
  type FeatureFlagInput,
  DEFAULT_FEATURE_FLAGS,
  FeatureNotAvailableError 
} from './feature-flags.types';

export interface FeatureFlagRepository {
  findByBrandAndFeature(brand: Brand, featureKey: FeatureKey): Promise<FeatureFlag | null>;
  findByBrand(brand: Brand): Promise<FeatureFlag[]>;
  create(input: FeatureFlagInput): Promise<FeatureFlag>;
  update(id: string, enabled: boolean): Promise<FeatureFlag>;
  delete(id: string): Promise<void>;
}

export class FeatureFlagService {
  constructor(private repository: FeatureFlagRepository) {}

  /**
   * Check if feature is enabled for brand
   */
  async isFeatureEnabled(brand: Brand, feature: FeatureKey): Promise<boolean> {
    try {
      // Check database first
      const featureFlag = await this.repository.findByBrandAndFeature(brand, feature);
      
      if (featureFlag) {
        return featureFlag.enabled;
      }

      // Fall back to default configuration
      const defaultValue = DEFAULT_FEATURE_FLAGS[brand]?.[feature];
      return defaultValue ?? false;
      
    } catch (error) {
      console.error(`Error checking feature flag ${feature} for brand ${brand}:`, error);
      
      // Fall back to default on error
      const defaultValue = DEFAULT_FEATURE_FLAGS[brand]?.[feature];
      return defaultValue ?? false;
    }
  }

  /**
   * Require feature to be enabled or throw error
   */
  async requireFeature(brand: Brand, feature: FeatureKey): Promise<void> {
    const enabled = await this.isFeatureEnabled(brand, feature);
    
    if (!enabled) {
      throw new FeatureNotAvailableError(feature, brand);
    }
  }

  /**
   * Get all feature flags for a brand
   */
  async getBrandFeatures(brand: Brand): Promise<Record<FeatureKey, boolean>> {
    try {
      const flags = await this.repository.findByBrand(brand);
      const result: Partial<Record<FeatureKey, boolean>> = {};

      // Start with defaults
      Object.assign(result, DEFAULT_FEATURE_FLAGS[brand] || {});

      // Override with database values
      for (const flag of flags) {
        result[flag.feature_key] = flag.enabled;
      }

      return result as Record<FeatureKey, boolean>;
      
    } catch (error) {
      console.error(`Error getting features for brand ${brand}:`, error);
      
      // Return defaults on error
      return (DEFAULT_FEATURE_FLAGS[brand] || {}) as Record<FeatureKey, boolean>;
    }
  }

  /**
   * Enable feature for brand
   */
  async enableFeature(brand: Brand, feature: FeatureKey, description?: string): Promise<FeatureFlag> {
    const existing = await this.repository.findByBrandAndFeature(brand, feature);
    
    if (existing) {
      return this.repository.update(existing.id, true);
    }

    return this.repository.create({
      brand,
      feature_key: feature,
      enabled: true,
      description
    });
  }

  /**
   * Disable feature for brand
   */
  async disableFeature(brand: Brand, feature: FeatureKey): Promise<FeatureFlag> {
    const existing = await this.repository.findByBrandAndFeature(brand, feature);
    
    if (existing) {
      return this.repository.update(existing.id, false);
    }

    return this.repository.create({
      brand,
      feature_key: feature,
      enabled: false
    });
  }

  /**
   * Check multiple features at once
   */
  async checkFeatures(brand: Brand, features: FeatureKey[]): Promise<Record<FeatureKey, boolean>> {
    const results: Partial<Record<FeatureKey, boolean>> = {};
    
    await Promise.all(
      features.map(async (feature) => {
        results[feature] = await this.isFeatureEnabled(brand, feature);
      })
    );
    
    return results as Record<FeatureKey, boolean>;
  }
}

/**
 * Middleware factory for feature flag checking
 */
export function requireFeature(feature: FeatureKey) {
  return async (brand: Brand, featureFlagService: FeatureFlagService) => {
    await featureFlagService.requireFeature(brand, feature);
  };
}