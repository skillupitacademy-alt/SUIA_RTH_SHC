/**
 * 🔥 GLOBAL ERROR HANDLER
 * 
 * Central error handling for all API routes.
 * Ensures consistent error responses with proper HTTP status codes.
 */

import { type AuthError,isAuthError } from '@quiz/auth';
import { NextResponse } from 'next/server';

export interface ErrorResponse {
  error: string;
  code: string;
  requestId?: string;
  timestamp: string;
}

/**
 * Handle API errors with proper status codes and formatting
 * 
 * @param error - The error to handle
 * @param requestId - Request ID for correlation
 * @returns NextResponse with proper error format
 */
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  const timestamp = new Date().toISOString();

  // 🔐 Handle AuthError (401, 403, etc.)
  if (isAuthError(error)) {
    const authError = error as AuthError;
    
    console.error(`[${authError.code}]`, {
      message: authError.message,
      statusCode: authError.statusCode,
      requestId,
      timestamp,
    });

    return NextResponse.json(
      {
        error: authError.message,
        code: authError.code,
        requestId,
        timestamp,
      } as ErrorResponse,
      { status: authError.statusCode }
    );
  }

  // 🔥 Handle unknown errors (real 500)
  const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error('🔥 UNHANDLED_ERROR', {
    message: errorMessage,
    stack: errorStack,
    requestId,
    timestamp,
  });

  return NextResponse.json(
    {
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      requestId,
      timestamp,
    } as ErrorResponse,
    { status: 500 }
  );
}

/**
 * Check if error is a known application error
 */
export function isKnownError(error: unknown): boolean {
  return isAuthError(error);
}
