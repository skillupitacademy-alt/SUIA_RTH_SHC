/**
 * Feature Flags Types
 * Brand-specific feature control
 */

import type { Brand } from '@quiz/types';

export type FeatureKey = 
  | 'AI_LABS'
  | 'PLACEMENT'
  | 'ADVANCED_ANALYTICS'
  | 'LIVE_SESSIONS'
  | 'PROJECT_REVIEWS'
  | 'CERTIFICATES'
  | 'MOBILE_APP'
  | 'API_ACCESS'
  | 'BULK_IMPORT'
  | 'CUSTOM_BRANDING';

// Re-export Brand for backward compatibility
export type { Brand };

export interface FeatureFlag {
  id: string;
  brand: Brand;
  feature_key: FeatureKey;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  description?: string;
}

export interface FeatureFlagInput {
  brand: Brand;
  feature_key: FeatureKey;
  enabled: boolean;
  description?: string;
}

export const DEFAULT_FEATURE_FLAGS: Record<Brand, Partial<Record<FeatureKey, boolean>>> = {
  realtutorialhub: {
    AI_LABS: true,
    ADVANCED_ANALYTICS: true,
    LIVE_SESSIONS: true,
    PROJECT_REVIEWS: true,
    CERTIFICATES: true,
    API_ACCESS: true,
    CUSTOM_BRANDING: false
  },
  
  skillup: {
    PLACEMENT: true,
    LIVE_SESSIONS: true,
    CERTIFICATES: true,
    MOBILE_APP: true,
    BULK_IMPORT: true,
    CUSTOM_BRANDING: true
  },

  skillhubcore: {
    PLACEMENT: true,
    ADVANCED_ANALYTICS: true,
    LIVE_SESSIONS: true,
    CERTIFICATES: true,
    API_ACCESS: true,
    CUSTOM_BRANDING: false
  }
};

export class FeatureNotAvailableError extends Error {
  constructor(feature: FeatureKey, brand: Brand) {
    super(`Feature '${feature}' is not available for brand '${brand}'`);
    this.name = 'FeatureNotAvailableError';
  }
}