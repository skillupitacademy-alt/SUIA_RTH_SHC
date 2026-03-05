
/**
 * Standardized API Error System (Task 45)
 */

export type ApiErrorCode = 
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'EXAM_NOT_FOUND'
  | 'AUTH_TOKEN_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED';

export interface ApiErrorResponse {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
    timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: ApiErrorCode = 'INTERNAL_ERROR',
    public details?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromError(err: unknown, status: number = 500, requestId?: string): ApiError {
    if (err instanceof ApiError) return err;
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new ApiError(status, message, 'INTERNAL_ERROR', undefined, requestId);
  }

  toResponse(): ApiErrorResponse {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
    };
  }
}

export const badRequest = (message: string, code: ApiErrorCode = 'BAD_REQUEST', details?: unknown) => 
  new ApiError(400, message, code, details);

export const unauthorized = (message: string = 'Unauthorized', code: ApiErrorCode = 'UNAUTHORIZED') => 
  new ApiError(401, message, code);

export const forbidden = (message: string = 'Forbidden', code: ApiErrorCode = 'FORBIDDEN') => 
  new ApiError(403, message, code);

export const notFound = (resource: string, id?: string) => {
  const hasId = id !== undefined && id !== null && id !== '';
  const suffix = hasId ? `: ${id}` : '';
  return new ApiError(404, `${resource} not found${suffix}`, 'NOT_FOUND');
};

export const validationError = (details: unknown) => 
  new ApiError(422, 'Validation failed', 'VALIDATION_FAILED', details);

export const internalError = (message: string = 'Internal Server Error') => 
  new ApiError(500, message, 'INTERNAL_ERROR');
