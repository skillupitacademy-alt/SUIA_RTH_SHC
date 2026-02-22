import { UserProfile } from '@quiz/api-client/types';
import { FetchClient } from '@quiz/api-client/core/fetch-client';

export class AuthClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: UserProfile; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password }
    );
  }

  async signup(email: string, password: string, name: string) {
    return this.client.post<{ user: UserProfile; accessToken: string }>(
      '/auth/signup',
      { email, password, name }
    );
  }

  async getSession() {
    return this.client.get<{ user: UserProfile; expiresAt: string | null }>('/auth/me');
  }

  async getAdminSession() {
    return this.client.get<{ user: UserProfile; expiresAt: string | null }>('/admin/auth/me');
  }

  async logout() {
    return this.client.post('/auth/logout', {});
  }

  async refresh(examId?: string) {
    return this.client.post<{ accessToken: string; expiresAt: string | null }>('/auth/refresh', { examId });
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    return this.client.post<UserProfile, Partial<UserProfile>>('/auth/profile', profileData);
  }

  async forgotPassword(email: string) {
    return this.client.post('/auth/forgot-password', { email });
  }

  async validateResetToken(token: string) {
    return this.client.get<{ valid: boolean }>(`/auth/reset-password?_token=${token}`);
  }

  async resetPassword(token: string, newPassword: string) {
    return this.client.post('/auth/reset-password', { token, password: newPassword });
  }

  async heartbeat() {
    return this.client.post('/auth/heartbeat', {});
  }

  async adminHeartbeat() {
    return this.client.post('/admin/auth/heartbeat', {});
  }
}
