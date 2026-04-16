import type {
  LoginApiResponse,
  LoginRequestData,
  LoginResultViewData,
  SignupRequestData,
} from './authViewData';
import { mapLoginError, mapLoginResponse } from './authMapper';

const LOGIN_ENDPOINT = '/api/auth/login';
const SIGNUP_ENDPOINT = '/api/auth/signup';
const AUTH_ME_ENDPOINT = '/api/auth/me';

async function submitAuthRequest(endpoint: string, data: { email: string; password: string; brand: LoginRequestData['brand']; name?: string }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-portal-identity': 'user',
      'x-brand': data.brand,
    },
    body: JSON.stringify({
      ...(typeof data.name === 'string' ? { name: data.name } : {}),
      email: data.email,
      password: data.password,
      platform: data.brand,
    }),
  });

  const payload = (await response.json().catch(() => null)) as LoginApiResponse | null;

  if (!response.ok) {
    throw mapLoginError(payload, response.status);
  }

  return mapLoginResponse(payload);
}

export async function loginUser(data: LoginRequestData): Promise<LoginResultViewData> {
  return submitAuthRequest(LOGIN_ENDPOINT, data);
}

export async function signupUser(data: SignupRequestData): Promise<LoginResultViewData> {
  return submitAuthRequest(SIGNUP_ENDPOINT, data);
}

export async function fetchCurrentUserState(): Promise<{ onboardingCompleted: boolean }> {
  const response = await fetch(AUTH_ME_ENDPOINT, {
    method: 'GET',
    credentials: 'include', // ✅ Send cookies
    headers: {
      accept: 'application/json',
      'x-portal-identity': 'user', // ✅ Required header
      // Note: x-brand header is automatically resolved from hostname by BFF
    },
    cache: 'no-store', // ✅ Avoid stale response
  });

  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }

  const payload = (await response.json().catch(() => null)) as
    | { user?: { onboardingCompleted?: boolean; onboarded?: boolean } }
    | null;

  // ✅ CRITICAL: user: null is VALID state, not an error
  return {
    onboardingCompleted:
      payload?.user?.onboardingCompleted === true || payload?.user?.onboarded === true,
  };
}
