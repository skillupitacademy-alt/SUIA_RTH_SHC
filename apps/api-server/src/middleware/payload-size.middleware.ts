/**
 * Payload Size Middleware
 * ========================
 * Validates request body size before JSON parsing to prevent:
 * - Memory exhaustion
 * - JSON parsing errors on oversized payloads
 * - DoS attacks via large payloads
 */

import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';

const MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Wraps a route handler to validate payload size before processing
 */
export function withPayloadSizeLimit<T extends (req: NextRequest, ...args: any[]) => Promise<Response>>(
  handler: T,
  maxBytes: number = MAX_BODY_SIZE_BYTES
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    // Check Content-Length header
    const contentLength = req.headers.get('content-length');
    
    if (contentLength !== null && contentLength !== '') {
      const size = parseInt(contentLength, 10);
      
      if (isNaN(size)) {
        return ApiResponse.error(
          badRequest('Invalid Content-Length header', 'VALIDATION_FAILED')
        );
      }
      
      if (size > maxBytes) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: `Payload too large. Maximum size: ${Math.round(maxBytes / 1024 / 1024)}MB`,
              status: 413,
            },
          }),
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // For requests without Content-Length, we'll rely on JSON parsing timeout
    // and the validateJsonSize check after parsing
    
    return handler(req, ...args);
  }) as T;
}
