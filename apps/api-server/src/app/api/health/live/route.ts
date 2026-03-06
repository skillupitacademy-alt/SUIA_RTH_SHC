import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { HealthService } from "@/modules/core/health.service";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const report = HealthService.getLivenessReport();
  return ApiResponse.success(report);
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'health_liveness' });
