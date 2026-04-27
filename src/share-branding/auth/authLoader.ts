import type {
  LoginApiResponse,
  LoginRequestData,
  LoginResultViewData,
  SignupRequestData,
} from './authViewData';
import { mapLoginError, mapLoginResponse } from './authMapper';
import { getDeviceHeaders } from '@quiz/auth';
import { unifiedFetch } from '../lib/unifiedFetch';
import { validateAuthState } from './validateAuthState';

const LOGIN_ENDPOINT = '/api/auth/login';
const SIGNUP_ENDPOINT = '/api/auth/signup';

async function submitAuthRequest(endpoint: string, data: { email: string; password: string; brand: LoginRequestData['brand']; name?: string }) {
  // 🔐 ENTERPRISE AUTH: Inject device context headers
  const deviceHeaders = getDeviceHeaders();
  
  const response = await unifiedFetch(endpoint, {
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
  // 🔥 CRITICAL FIX: Use lightweight validation instead of heavy /api/profile
  console.log('[AUTH_LOADER] Using lightweight auth validation');
  
  const auth = await validateAuthState();
  
  if (!auth) {
    // Not authenticated
    return { onboardingCompleted: false };
  }
  
  console.log('[AUTH_LOADER] Auth validation success:', {
    userId: auth.id.slice(0, 8),
    onboardingCompleted: auth.onboardingCompleted,
    roles: auth.roles,
  });
  
  return {
    onboardingCompleted: auth.onboardingCompleted === true,
  };
}

export async function logoutUser() {
  const response = await unifiedFetch('/api/auth/logout', {
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
