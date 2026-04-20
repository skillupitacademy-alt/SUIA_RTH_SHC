import type {
  LoginApiResponse,
  LoginRequestData,
  LoginResultViewData,
  SignupRequestData,
} from './authViewData';
import { mapLoginError, mapLoginResponse } from './authMapper';
import { getDeviceHeaders } from '@quiz/auth';

const LOGIN_ENDPOINT = '/api/auth/login';
const SIGNUP_ENDPOINT = '/api/auth/signup';
const AUTH_ME_ENDPOINT = '/api/auth/me';

async function submitAuthRequest(endpoint: string, data: { email: string; password: string; brand: LoginRequestData['brand']; name?: string }) {
  // 🔐 ENTERPRISE AUTH: Inject device context headers
  const deviceHeaders = getDeviceHeaders();
  
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-portal-identity': 'user',
      'x-brand': data.brand,
      ...deviceHeaders, // 🔥 CRITICAL FIX: Device tracking
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
  // 🚀 OPTIMIZATION: Use profile API instead of separate /auth/me call
  // This eliminates duplicate network requests and uses our internal authentication
  const timestamp = Date.now();
  
  const response = await fetch(`/api/profile?_t=${timestamp}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'x-portal-identity': 'user',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    // If profile fails, user might not be authenticated or onboarded
    if (response.status === 404) {
      // Profile not found = user not onboarded yet
      return { onboardingCompleted: false };
    }
    throw new Error('Failed to fetch session');
  }

  const payload = (await response.json().catch(() => null)) as
    | { user?: { onboardingCompleted?: boolean; onboarded?: boolean }; onboardingCompleted?: boolean }
    | null;

  // Check both user.onboardingCompleted and direct onboardingCompleted
  return {
    onboardingCompleted:
      payload?.user?.onboardingCompleted === true || 
      payload?.user?.onboarded === true ||
      payload?.onboardingCompleted === true,
  };
}

export async function logoutUser() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'x-portal-identity': 'user',
    },
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  // 🔐 ENTERPRISE AUTH: Clear device context on logout
  // This ensures fresh device ID on next login if user wants
  // Note: Keeping device ID persistent is also valid - depends on product requirements
  // For now, we keep it persistent for better device tracking
}
