import { UserProfile } from '@quiz/api-client/types';
import { FetchClient, TIMEOUTS } from '@quiz/api-client/core/fetch-client';
import { normalizeSkillHubUser } from '../lib/normalize-auth-user';

export class AuthClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async login(email: string, password: string) {
    const response = await this.client.post<{ user: UserProfile; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
      { timeout: TIMEOUTS.STANDARD }
    );

    return {
      ...response,
      user: normalizeSkillHubUser(response.user ?? {}, email),
    };
  }

  async signup(email: string, password: string, name: string) {
    return this.client.post<{ user: UserProfile; accessToken: string }>(
      '/auth/signup',
      { email, password, name },
      { timeout: TIMEOUTS.STANDARD }
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
    const response = await this.client.get<{ user: UserProfile; expiresAt: string | null }>('/auth/me', { timeout: TIMEOUTS.QUICK });
    return {
      ...response,
      user: normalizeSkillHubUser(response.user ?? {}),
    };
  }

  async logout() {
    return this.client.post(
      '/auth/logout',
      {
        refreshToken: this.getStoredRefreshToken(),
      },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  private getStoredRefreshToken(): string {
    if (typeof document === 'undefined') {
      return '';
    }

    const cookieNames = ['refreshToken'];
    const cookieMap = new Map(
      document.cookie
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((entry) => {
          const separatorIndex = entry.indexOf('=');
          if (separatorIndex === -1) {
            return [entry, ''] as const;
          }

          const key = entry.slice(0, separatorIndex);
          const value = entry.slice(separatorIndex + 1);
          return [key, decodeURIComponent(value)] as const;
        }),
    );

    for (const name of cookieNames) {
      const token = cookieMap.get(name);
      if (typeof token === 'string' && token.trim().length > 0) {
        return token.trim();
      }
    }

    return '';
  }

  async refresh(examId?: string) {
    return this.client.post<{ accessToken: string; expiresAt: string | null }>('/auth/refresh', { examId }, { timeout: TIMEOUTS.STANDARD });
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    return this.client.post<UserProfile, Partial<UserProfile>>('/auth/profile', profileData, { timeout: TIMEOUTS.STANDARD });
  }

  async forgotPassword(email: string) {
    return this.client.post('/auth/forgot-password', { email }, { timeout: TIMEOUTS.STANDARD });
  }

  async validateResetToken(token: string) {
    return this.client.get<{ valid: boolean }>(`/auth/reset-password?_token=${token}`, { timeout: TIMEOUTS.STANDARD });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.client.post('/auth/reset-password', { token, password: newPassword }, { timeout: TIMEOUTS.STANDARD });
  }

  async heartbeat() {
    return this.client.post('/auth/heartbeat', {}, { timeout: TIMEOUTS.QUICK });
  }

  async adminHeartbeat() {
    return this.client.post('/admin/auth/heartbeat', {}, { timeout: TIMEOUTS.QUICK });
  }
}
