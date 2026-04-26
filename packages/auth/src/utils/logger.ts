/**
 * 🔍 OBSERVABILITY LOGGER
 * 
 * Structured logging for auth events across all services.
 * All logs are JSON for easy parsing in production.
 * 
 * Usage:
 *   logEvent('AUTH_SUCCESS', { userId, brand, roles })
 *   logEvent('RBAC_AUDIT', { permission, result })
 */

export interface LogEvent {
  tag: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Log a structured event
 * 
 * @param tag - Event type (e.g., 'AUTH_SUCCESS', 'RBAC_AUDIT')
 * @param data - Event data
 */
export function logEvent(tag: string, data: Record<string, any> = {}): void {
  const payload: LogEvent = {
    tag,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Production-safe: single line JSON
  console.log(JSON.stringify(payload));
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
 * Log RBAC decision
 */
export function logRbacAudit(data: {
  requestId?: string;
  userId: string;
  roles: string[];
  permission: string;
  result: 'GRANTED' | 'DENIED';
  resource?: string;
}): void {
  logEvent('RBAC_AUDIT', data);
}

/**
 * Log API request start
 */
export function logApiRequest(data: {
  requestId: string;
  path: string;
  method: string;
  brand?: string;
  userId?: string;
}): void {
  logEvent('API_REQUEST_START', data);
}

/**
 * Log API response
 */
export function logApiResponse(data: {
  requestId: string;
  status: number;
  duration?: number;
}): void {
  logEvent('API_RESPONSE', data);
}

/**
 * Log API error
 */
export function logApiError(data: {
  requestId: string;
  error: string;
  status?: number;
  stack?: string;
}): void {
  logEvent('API_ERROR', data);
}

/**
 * Log performance metric
 */
export function logPerformance(data: {
  requestId: string;
  path: string;
  duration: number;
  operation?: string;
}): void {
  logEvent('PERF_API', data);
}

/**
 * Log internal fetch
 */
export function logInternalFetch(data: {
  requestId?: string;
  url: string;
  method: string;
  internal: boolean;
  duration?: number;
}): void {
  logEvent('INTERNAL_FETCH', data);
}

/**
 * Log gateway event
 */
export function logGatewayEvent(data: {
  requestId: string;
  path: string;
  brand: string;
  roles?: string[];
  action: string;
}): void {
  logEvent('GATEWAY_REQUEST', data);
}
