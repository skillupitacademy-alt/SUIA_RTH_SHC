import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiError, validationError } from './api-error';
import { ApiResponse } from './api-response';
import { runWithTrace } from './trace.context';

/**
 * Enhanced API Route Handler Wrapper (Tasks 29, 35)
 * Handles: Tracing, Logging, Error Normalization, and Zod Validation
 */
export function withApiHandler<T, S extends z.Schema>(
  handler: (req: NextRequest, body: z.infer<S>, ...args: unknown[]) => Promise<T>,
  options?: {
    schema?: S;
    component?: string;
    operation?: string;
  }
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // 1. Extract or generate Correlation ID
    const incomingCorrelationId = req.headers.get('x-correlation-id');
    const correlationId =
      incomingCorrelationId !== null && incomingCorrelationId !== ''
        ? incomingCorrelationId
        : crypto.randomUUID();

    return runWithTrace(correlationId, async () => {
      try {
        let body = undefined;
        
        // 2. Automated Zod Validation (if schema provided)
        if (options?.schema) {
          try {
            const rawBody = await req.json();
            body = options.schema.parse(rawBody);
          } catch (e) {
            if (e instanceof z.ZodError) {
              throw validationError(e.errors);
            }
            throw ApiError.fromError(e, 400);
          }
        }

        // 3. Execute Handler
        const result = await handler(req, body, ...args);

        // 4. Return Success Response
        if (result instanceof NextResponse) {
          return result;
        }
        
        return ApiResponse.success(result);

      } catch (error: unknown) {
        // 5. Centralized Error Mapping
        const apiError = error instanceof ApiError 
          ? error 
          : ApiError.fromError(error);

        // Log unexpected internal errors
        if (apiError.status >= 500) {
          console.error(`[API Error] ${options?.component ?? 'unknown'}:${options?.operation ?? 'unknown'}`, error);
          // Task 32: Explicit Sentry Capture for visibility
          Sentry.captureException(error);
        }

        return ApiResponse.error(apiError, apiError.status);
      }
    });
  };
}

/**
 * Legacy tracing-only wrapper (keep for compatibility if needed)
 */
export function withTracing<T>(handler: (req: NextRequest, ...args: unknown[]) => Promise<T>) {
  return async (req: NextRequest, ...args: unknown[]): Promise<T> => {
    // 1. Extract or generate Correlation ID
    const incomingCorrelationId = req.headers.get('x-correlation-id');
    const correlationId =
      incomingCorrelationId !== null && incomingCorrelationId !== ''
        ? incomingCorrelationId
        : crypto.randomUUID();
    
    // 2. Execute the handler entirely enclosed within the AsyncLocalStorage
    return runWithTrace(correlationId, () => handler(req, ...args));
  };
}
