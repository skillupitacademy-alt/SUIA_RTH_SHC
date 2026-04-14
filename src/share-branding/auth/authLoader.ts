import type { LoginApiResponse, LoginRequestData, LoginResultViewData, SignupRequestData } from './authViewData';
import { mapLoginError, mapLoginResponse } from './authMapper';

const LOGIN_ENDPOINT = '/api/auth/login';
const SIGNUP_ENDPOINT = '/api/auth/signup';

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
