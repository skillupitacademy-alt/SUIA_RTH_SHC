import { FetchClient } from '../core/fetch-client';

export class AuthClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { email, password });
  }

  async signup(email: string, password: string, name: string) {
    return this.client.post<{ user: any }>('/auth/signup', { email, password, name });
  }

  async getSession() {
    return this.client.get<{ user: any }>('/auth/me');
  }

  async logout() {
    return this.client.post('/auth/logout', {});
  }
}
