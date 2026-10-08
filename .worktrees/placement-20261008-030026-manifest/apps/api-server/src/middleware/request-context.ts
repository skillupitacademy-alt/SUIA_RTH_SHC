/**
 * 🔍 REQUEST CONTEXT
 * 
 * Builds request context for observability.
 * Every request gets a unique ID for tracing.
 */

import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

export interface RequestContext {
  requestId: string;
  path: string;
  method: string;
  timestamp: number;
  brand?: string;
  userId?: string;
}

/**
 * Build request context for logging
 * 
 * @param req - Next.js request
 * @returns Request context
 */
export function buildRequestContext(req: NextRequest): RequestContext {
  const url = new URL(req.url);
  
  return {
    requestId: randomUUID(),
    path: url.pathname,
    method: req.method,
    timestamp: Date.now(),
  };
}

/**
 * Extract request ID from headers or generate new one
 * 
 * @param req - Next.js request
 * @returns Request ID
 */
export function getRequestId(req: NextRequest): string {
  const requestId = req.headers.get('x-request-id');
  return (typeof requestId === 'string' && requestId.trim() !== '') ? requestId : randomUUID();
}
