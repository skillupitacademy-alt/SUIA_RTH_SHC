import { type NextRequest } from "next/server";
import { badRequest } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";

export const dynamic = 'force-dynamic';

const SENSITIVE_FIELDS = ['email', 'password', 'token', 'ssn', 'phone', 'secret', 'key'];

function scrubPII(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(scrubPII);
  if (typeof data === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        scrubbed[key] = '[SCRUBBED]';
      } else {
        scrubbed[key] = scrubPII(value);
      }
    }
    return scrubbed;
  }
  return data;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const payload = await req.json().catch(() => null);
    if (payload === null || typeof payload !== 'object') {
      return ApiResponse.error(badRequest("Invalid telemetry payload"));
    }

    if (!validateJsonDepth(payload) || !validateJsonSize(payload)) {
      return ApiResponse.error(badRequest("Payload too deep or large"));
    }

    const sanitizedPayload = sanitizeJsonField(payload) as Record<string, unknown>;
    const { type, event, metric, value, tags, metadata, severity, requestId, sessionId } = sanitizedPayload;

    // 1. Handle explicit metrics from client
    if (type === 'metric' && typeof metric === 'string') {
        const val = typeof value === 'number' ? value : 1;
        const tagObj = typeof tags === 'object' && tags !== null ? tags : {};
        if (metric.endsWith('.duration') || metric.endsWith('.ms')) {
            recordTimer(metric, val, tagObj as Record<string, string>);
        } else {
            recordCounter(metric, val, tagObj as Record<string, string>);
        }
        return ApiResponse.success({ success: true });
    }

    // 2. Handle structured logging
    const metaObj = typeof metadata === 'object' && metadata !== null ? metadata : {};
    const scrubbedMetadata = scrubPII(metaObj);

    logger.info({
        component: "telemetry",
        operation: typeof event === 'string' && event !== '' ? event : "client_event",
        requestId: typeof requestId === 'string' && requestId !== '' ? requestId : req.headers.get('x-request-id'),
        sessionId: typeof sessionId === 'string' ? sessionId : undefined,
        severity: typeof severity === 'string' && severity !== '' ? severity : "info",
        ...scrubbedMetadata as Record<string, unknown>
    }, `[Telemetry] ${typeof event === 'string' && event !== '' ? event : 'Client Log'}`);

    const durationMs = Date.now() - start;
    recordCounter('system.api.telemetry.count', 1, { event: typeof event === 'string' ? event : 'unknown', outcome: 'success' });
    recordTimer('system.api.telemetry.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({ success: true }, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_err) {
    recordCounter('system.api.telemetry.count', 1, { outcome: 'failure' });
    return ApiResponse.error(badRequest("Invalid telemetry payload"));
  }
}

export const POST = withLogging(handler, { component: "telemetry", operation: "capture" });
