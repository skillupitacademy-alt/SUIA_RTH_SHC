/**
 * 🔐 ENTERPRISE AUTH: Client-Side Auth Helper
 * 
 * Automatically injects device context headers into auth API requests.
 * This ensures multi-device session tracking works correctly.
 */

import { getDeviceHeaders } from '@quiz/auth';

/**
 * Make an authenticated API request with device context headers
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // 🔐 Inject device context headers
  const deviceHeaders = getDeviceHeaders();
  Object.entries(deviceHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 🔥 CRITICAL: Include cookies in all auth requests
  });
}

/**
 * Login with device context
 */
export async function login(email: string, password: string, platform: string) {
  return authFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, platform }),
  });
}

/**
 * Refresh tokens with device context
 */
export async function refreshTokens(examId?: string) {
  return authFetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ examId }),
  });
}

/**
 * Logout with device context
 */
export async function logout() {
  return authFetch('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Get active sessions (for multi-device management)
 */
export async function getActiveSessions() {
  return authFetch('/api/auth/sessions', {
    method: 'GET',
  });
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string) {
  return authFetch(`/api/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

/**
 * Global logout (all devices)
 */
export async function logoutAllDevices() {
  return authFetch('/api/auth/sessions', {
    method: 'DELETE',
  });
}
