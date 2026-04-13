import type { LoginRequestData, LoginApiResponse, LoginResultViewData } from './authViewData';
import { mapLoginError, mapLoginResponse } from './authMapper';

const LOGIN_ENDPOINT = '/api/auth/login';

export async function loginUser(data: LoginRequestData): Promise<LoginResultViewData> {
  const response = await fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-portal-identity': 'user',
      'x-brand': data.brand,
    },
    body: JSON.stringify({
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
