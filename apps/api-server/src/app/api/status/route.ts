import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { HealthService } from "@/modules/core/health.service";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const report = await HealthService.getReadinessReport();
  
  return ApiResponse.success({
    ...report,
    environment: process.env.NODE_ENV,
  });
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'health_status' });
