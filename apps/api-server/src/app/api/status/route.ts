import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const start = Date.now();
  recordCounter('system.api.status.check', 1);
  const data = {
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.2.0'
  };
  recordTimer('system.api.status.duration', Date.now() - start);
  return ApiResponse.success(data);
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'health_check' });
