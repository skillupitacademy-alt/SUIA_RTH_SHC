import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { HealthService } from "@/modules/core/health.service";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const report = await HealthService.getReadinessReport();
  
  const statusCode = report.status === 'unhealthy' ? 503 : 200;
  
  return ApiResponse.success(report, statusCode);
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'health_readiness' });
