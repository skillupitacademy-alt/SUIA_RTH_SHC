import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthClient } from '../auth-client';
import { TIMEOUTS } from '../../core/fetch-client';

vi.mock('../../lib/normalize-auth-user', () => ({
  normalizeSkillHubUser: vi.fn((user: Record<string, unknown>) => user),
}));

describe('AuthClient', () => {
  let client: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let authClient: AuthClient;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
    };
    authClient = new AuthClient(client as never);
  });

  it('uses the user session endpoint for getSession', async () => {
    client.get.mockResolvedValue({ user: { id: 'u1' }, expiresAt: null });

    await authClient.getSession();

    expect(client.get).toHaveBeenCalledWith('/auth/me', { timeout: expect.any(Number) });
  });

  it('uses the admin session endpoint for getAdminSession', async () => {
    client.get.mockResolvedValue({ user: { id: 'a1' }, expiresAt: null });

    await authClient.getAdminSession();

    expect(client.get).toHaveBeenCalledWith('/admin/auth/me', { timeout: TIMEOUTS.STANDARD });
  });

  it('sends explicit brand metadata during login', async () => {
    client.post.mockResolvedValue({ user: { id: 'u1' } });

    await authClient.login('u@test.com', 'pw', 'realtutorialhub');

    expect(client.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'u@test.com', password: 'pw', platform: 'realtutorialhub' },
      { timeout: expect.any(Number), headers: { 'x-brand': 'realtutorialhub' } }
    );
  });
});
