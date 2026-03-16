export type FeatureFlag =
  | 'BFF_QUIZ_HIERARCHY'
  | 'BFF_EXAM_CONFIG'
  | 'BFF_ADMIN_DASHBOARD'
  | 'SAFE_MODE'
  | 'DISTRIBUTED_EVENTS';

const FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  BFF_QUIZ_HIERARCHY: 'FEATURE_BFF_QUIZ_HIERARCHY',
  BFF_EXAM_CONFIG: 'FEATURE_BFF_EXAM_CONFIG',
  BFF_ADMIN_DASHBOARD: 'FEATURE_BFF_ADMIN_DASHBOARD',
  SAFE_MODE: 'SAFE_MODE',
  DISTRIBUTED_EVENTS: 'DISTRIBUTED_EVENTS',
};

export class FeatureFlagService {
  static isEnabled(flag: FeatureFlag): boolean {
    return process.env[FLAG_ENV_MAP[flag]] === 'true';
  }

  static getAll(): Record<FeatureFlag, boolean> {
    return {
      BFF_QUIZ_HIERARCHY: FeatureFlagService.isEnabled('BFF_QUIZ_HIERARCHY'),
      BFF_EXAM_CONFIG: FeatureFlagService.isEnabled('BFF_EXAM_CONFIG'),
      BFF_ADMIN_DASHBOARD: FeatureFlagService.isEnabled('BFF_ADMIN_DASHBOARD'),
      SAFE_MODE: FeatureFlagService.isEnabled('SAFE_MODE'),
      DISTRIBUTED_EVENTS: FeatureFlagService.isEnabled('DISTRIBUTED_EVENTS'),
    };
  }
}
