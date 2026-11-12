import type { LoginApiResponse, LoginResultViewData } from './authViewData';

function publicAuthErrorMessage(status: number): string {
  if (status === 401) return 'Invalid email or password.';
  if (status === 403) return 'Access denied.';
  if (status === 429) return 'Too many attempts. Try again later.';
  if (status === 400 || status === 422) return 'Please check your details.';
  if (status === 409) return 'Account cannot be created with those details.';
  return 'Authentication service is temporarily unavailable.';
}

export function mapLoginResponse(response: LoginApiResponse | null): LoginResultViewData {
  return {
    success: true,
    user: response?.user,
    expiresAt: response?.expiresAt ?? null,
  };
}

export function mapLoginError(_response: LoginApiResponse | null, status: number): Error {
  return new Error(publicAuthErrorMessage(status));
}
