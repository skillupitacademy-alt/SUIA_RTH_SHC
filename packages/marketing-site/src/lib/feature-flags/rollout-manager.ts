import type { AnalyticsBrandId, AnalyticsEnvironment } from "../../config/analytics";
import { getMarketingFeatureFlag } from "./feature-flags";
import { isTargeted } from "./targeting-engine";

export function isFeatureEnabled(
  key: Parameters<typeof getMarketingFeatureFlag>[0],
  input: { brandId: AnalyticsBrandId; environment: AnalyticsEnvironment; anonymousId?: string },
) {
  const flag = getMarketingFeatureFlag(key);
  if (!flag) return false;
  return isTargeted(flag, input);
}

