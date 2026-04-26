/**
 * 🔍 OBSERVABILITY MIDDLEWARE — ENFORCED GLOBALLY
 * 
 * 🔥 CRITICAL: ALL API routes MUST use this wrapper.
 * This ensures observability is GUARANTEED, not optional.
 * 
 * Usage:
 *   export const GET = withObservability(async (req, obsCtx) => {
 *     // obsCtx.requestId is available for correlation
 *     // your handler
 *   });
 * 
 * Features:
 * - Automatic request/response logging
 * - Request ID correlation across all logs
 * - Error tracking with context
 * - Performance timing
 */

import type { NextRequest, NextResponse } from 'next/server';
import { buildRequestContext, type RequestContext } from './request-context';
import { handleApiError } from '@/lib/global-error-handler';

/**
 * Log event helper with automatic timestamp
 */
function logEvent(tag: string, data: Record<string, any>): void {
  console.log(JSON.stringify({
    tag,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

/**
 * 🔥 GLOBAL REQUEST CONTEXT STORAGE
 * Allows any code to access current requestId for correlation
 */
const requestContextStore = new Map<string, RequestContext>();

export function getCurrentRequestContext(): RequestContext | undefined {
  // In production, use AsyncLocalStorage for proper async context
  // For now, return undefined if not found
  return undefined;
}

/**
 * 🔥 ENFORCED OBSERVABILITY WRAPPER
 * 
 * Wraps route handlers with automatic observability.
 * EVERY route MUST use this to ensure consistent logging.
 * 
 * @param handler - Route handler that receives (req, obsCtx, ...rest)
 * @returns Wrapped handler with full observability
 */
export function withObservability<T extends Response | NextResponse>(
  handler: (req: NextRequest, obsCtx: RequestContext, ...rest: any[]) => Promise<T>
): (req: NextRequest, ...rest: any[]) => Promise<T> {
  return async (req: NextRequest, ...rest: any[]): Promise<T> => {
    const obsCtx = buildRequestContext(req);
    const startTime = Date.now();

    // 🔍 Log request start
    logEvent('API_REQUEST_START', {
      requestId: obsCtx.requestId,
      path: obsCtx.path,
      method: obsCtx.method,
    });

    try {
      // 🔥 Execute handler with observability context
      const response = await handler(req, obsCtx, ...rest);
      
      // 🔍 Log success
      const duration = Date.now() - startTime;
      logEvent('API_RESPONSE', {
        requestId: obsCtx.requestId,
        status: response.status,
        duration,
      });

      // 🔥 Add request ID to response headers for client-side correlation
      response.headers.set('X-Request-Id', obsCtx.requestId);

      return response;
      
    } catch (error: any) {
      // 🔍 Log error with full context
      const duration = Date.now() - startTime;
      logEvent('API_ERROR', {
        requestId: obsCtx.requestId,
        error: error.message,
        status: error.statusCode || error.status || 500,
        path: obsCtx.path,
        method: obsCtx.method,
        duration,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });

      // 🔥 Use global error handler for consistent error responses
      return handleApiError(error, obsCtx.requestId) as T;
    }
  };
}

/**
 * Log auth success
 */
export function logAuthSuccess(data: {
  requestId: string;
  userId: string;
  brand: string;
  roles: string[];
  path?: string;
}): void {
  logEvent('AUTH_SUCCESS', data);
}

/**
 * Log auth failure
 */
export function logAuthFailure(data: {
  requestId: string;
  reason: string;
  path: string;
  brand?: string;
}): void {
  logEvent('AUTH_FAILURE', data);
}

/**
 * Log performance metric
 */
export function logPerformance(data: {
  requestId: string;
  operation: string;
  duration: number;
}): void {
  logEvent('PERF_METRIC', data);
}
