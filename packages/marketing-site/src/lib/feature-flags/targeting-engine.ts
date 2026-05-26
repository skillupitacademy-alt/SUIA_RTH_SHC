import type { AnalyticsBrandId, AnalyticsEnvironment } from "../../config/analytics";
import type { MarketingFeatureFlag } from "./feature-flags";

export function isTargeted(flag: MarketingFeatureFlag, input: {
  brandId: AnalyticsBrandId;
  environment: AnalyticsEnvironment;
  anonymousId?: string;
}) {
  if (!flag.enabled) return false;
  if (flag.brands && !flag.brands.includes(input.brandId)) return false;
  if (flag.environments && !flag.environments.includes(input.environment)) return false;

  if (typeof flag.rolloutPercentage === "number" && input.anonymousId) {
    const bucket = input.anonymousId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
    return bucket < flag.rolloutPercentage;
  }

  return true;
}

