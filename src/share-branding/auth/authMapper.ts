import type { LoginApiResponse, LoginResultViewData } from './authViewData';

function extractErrorMessage(response: LoginApiResponse | null): string {
  const candidate = response?.error ?? response?.message ?? response?._error;
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate.trim()
    : 'Authentication failed';
}

export function mapLoginResponse(response: LoginApiResponse | null): LoginResultViewData {
  return {
    success: true,
    user: response?.user,
    expiresAt: response?.expiresAt ?? null,
  };
}

export function mapLoginError(response: LoginApiResponse | null, status: number): Error {
  const message = extractErrorMessage(response);

  if (status === 401) {
    return new Error(message || 'Invalid credentials');
  }

  if (status === 403) {
    return new Error(message || 'Access denied');
  }

  return new Error(message);
}
