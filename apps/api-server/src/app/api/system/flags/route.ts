import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { featureFlags } from "@/modules/system/feature-flags.service";

export const dynamic = 'force-dynamic';

async function getHandler() {
  return ApiResponse.success({
    flags: featureFlags.getAllFlags(),
    timestamp: new Date().toISOString(),
  });
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'get_feature_flags' });
