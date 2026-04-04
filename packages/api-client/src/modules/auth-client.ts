import { UserProfile } from '@quiz/api-client/types';
import { FetchClient, TIMEOUTS } from '@quiz/api-client/core/fetch-client';
import { normalizeSkillHubUser } from '../lib/normalize-auth-user';

type RequestBrand = 'realtutorialhub' | 'skillup';

export class AuthClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async login(email: string, password: string, brand: RequestBrand = 'realtutorialhub') {
    const response = await this.client.post<{ user: UserProfile; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password, platform: brand },
      { timeout: TIMEOUTS.STANDARD, headers: { 'x-brand': brand } }
    );

    return {
      ...response,
      user: normalizeSkillHubUser(response.user ?? {}, email),
    };
  }

  async signup(email: string, password: string, name: string, brand: RequestBrand = 'realtutorialhub') {
    return this.client.post<{ user: UserProfile; accessToken: string }>(
      '/auth/signup',
      { email, password, name, platform: brand },
      { timeout: TIMEOUTS.STANDARD, headers: { 'x-brand': brand } }
    );
  }

  async getSession() {
    const response = await this.client.get<{ user: UserProfile; expiresAt: string | null }>('/auth/me', { timeout: TIMEOUTS.QUICK });
    return {
      ...response,
      user: normalizeSkillHubUser(response.user ?? {}),
    };
  }

  async getAdminSession() {
    const response = await this.client.get<{ user: UserProfile; expiresAt: string | null }>('/admin/auth/me', { timeout: TIMEOUTS.QUICK });
    return {
      ...response,
      user: normalizeSkillHubUser(response.user ?? {}),
    };
  }

  async logout() {
    return this.client.post('/auth/logout', {}, { timeout: TIMEOUTS.STANDARD });
  }

  async refresh(examId?: string) {
    return this.client.post<{ accessToken: string; expiresAt: string | null }>('/auth/refresh', { examId }, { timeout: TIMEOUTS.STANDARD });
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    return this.client.post<UserProfile, Partial<UserProfile>>('/auth/profile', profileData, { timeout: TIMEOUTS.STANDARD });
  }

  async forgotPassword(email: string, brand: RequestBrand = 'realtutorialhub') {
    return this.client.post(
      '/auth/forgot-password',
      { email, platform: brand },
      { timeout: TIMEOUTS.STANDARD, headers: { 'x-brand': brand } }
    );
  }

  async validateResetToken(token: string, brand: RequestBrand = 'realtutorialhub') {
    return this.client.get<{ valid: boolean }>(`/auth/reset-password?_token=${token}`, {
      timeout: TIMEOUTS.STANDARD,
      headers: { 'x-brand': brand, 'x-platform': brand },
    });
  }

  async resetPassword(token: string, newPassword: string, brand: RequestBrand = 'realtutorialhub') {
    return this.client.post(
      '/auth/reset-password',
      { token, password: newPassword, platform: brand },
      { timeout: TIMEOUTS.STANDARD, headers: { 'x-brand': brand } }
    );
  }

  async heartbeat() {
    return this.client.post('/auth/heartbeat', {}, { timeout: TIMEOUTS.QUICK });
  }

  async adminHeartbeat() {
    return this.client.post('/admin/auth/heartbeat', {}, { timeout: TIMEOUTS.QUICK });
  }
}
