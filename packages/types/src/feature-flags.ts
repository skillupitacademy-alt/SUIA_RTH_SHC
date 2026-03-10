export enum FeatureFlag {
  ADMIN_ANALYTICS_V2 = 'ADMIN_ANALYTICS_V2',
  BETA_EXAM_ENGINE = 'BETA_EXAM_ENGINE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  DEBUG_OVERLAY = 'DEBUG_OVERLAY',
  ENHANCED_DLQ_UI = 'ENHANCED_DLQ_UI',
}

export type FeatureFlagsMap = Partial<Record<FeatureFlag, boolean>>;
