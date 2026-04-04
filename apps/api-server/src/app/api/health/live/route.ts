import { ApiResponse } from "@/lib/api-response";
import { HealthService } from "@/modules/core/health.service";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const report = HealthService.getLivenessReport();
  return ApiResponse.success(report);
}

export const GET = getHandler;
