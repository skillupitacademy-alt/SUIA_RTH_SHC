import type { AnalyticsBrandId, AnalyticsEnvironment } from "../../config/analytics";

export interface MarketingFeatureFlag {
  key:
    | "analytics_sdk_v2"
    | "meta_capi_rollout"
    | "gtm_rollout"
    | "identity_resolution"
    | "advanced_sessionization";
  enabled: boolean;
  environments?: AnalyticsEnvironment[];
  brands?: AnalyticsBrandId[];
  rolloutPercentage?: number;
}

export const marketingFeatureFlags: MarketingFeatureFlag[] = [
  { key: "analytics_sdk_v2", enabled: true },
  { key: "meta_capi_rollout", enabled: true, rolloutPercentage: 100 },
  { key: "gtm_rollout", enabled: true, rolloutPercentage: 100 },
  { key: "identity_resolution", enabled: true, rolloutPercentage: 100 },
  { key: "advanced_sessionization", enabled: true, rolloutPercentage: 100 },
];

export function getMarketingFeatureFlag(key: MarketingFeatureFlag["key"]) {
  return marketingFeatureFlags.find((flag) => flag.key === key);
}

