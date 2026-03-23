import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@quiz/auth', () => {
  return {
    TokenService: {
      verifySkillHubCoreJWT: vi.fn(async (token: string) => {
        if (token === 'token-super-admin') {
          return {
            sub: 'user-1',
            roles: ['super_admin'],
            subscriptions: ['combo'],
            exp: Math.floor(Date.now() / 1000) + 3600,
          };
        }

        if (token === 'token-admin') {
          return {
            sub: 'user-2',
            roles: ['admin'],
            subscriptions: ['training'],
            exp: Math.floor(Date.now() / 1000) + 3600,
          };
        }

        return {
          sub: 'user-3',
          roles: ['student'],
          subscriptions: ['free'],
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
      }),
    },
  };
});

import { POST as verifyTotp } from '../auth/verify-totp/route';
import { GET as getAuditLog } from '../audit-log/route';
import { PATCH as updateSubscription } from '../subscriptions/[id]/route';
import { GET as getSubscriptions } from '../subscriptions/route';
import { GET as getUser } from '../users/[id]/route';
import { PATCH as changeRole } from '../users/[id]/role/route';
import { PATCH as suspendUser } from '../users/[id]/suspend/route';
import { GET as getUsers } from '../users/route';

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

const originalTotpSecret = process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET;

async function getSessionToken() {
  const response = await verifyTotp(
    makeRequest('http://localhost/api/admin/auth/verify-totp', {
      method: 'POST',
      headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
      body: JSON.stringify({ code: '123456' }),
    }),
  );
  const body = (await response.json()) as { sessionToken: string };
  return body.sessionToken;
}

beforeEach(() => {
  process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET = 'skillhubcore-admin-test-secret';
  vi.clearAllMocks();
});

afterAll(() => {
  if (originalTotpSecret === undefined) {
    delete process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET;
    return;
  }

  process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET = originalTotpSecret;
});

describe('skillhubcore-admin api', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await getUsers(makeRequest('http://localhost/api/admin/users'));
    expect(response.status).toBe(401);
  });

  it('verifies totp and issues a session token', async () => {
    const response = await verifyTotp(
      makeRequest('http://localhost/api/admin/auth/verify-totp', {
        method: 'POST',
        headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
        body: JSON.stringify({ code: '123456' }),
      }),
    );
    const body = (await response.json()) as { verified: boolean; sessionToken: string };
    expect(response.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(body.sessionToken.length).toBeGreaterThan(10);
  });

  it('lists users for super admin', async () => {
    const response = await getUsers(
      makeRequest('http://localhost/api/admin/users?search=Asha', {
        headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
      }),
    );
    const body = (await response.json()) as { users: Array<{ name: string }> };
    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.users[0]?.name).toBe('Asha Menon');
  });

  it('returns a single user', async () => {
    const response = await getUser(
      makeRequest('http://localhost/api/admin/users/user-2', {
        headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
      }),
      { params: Promise.resolve({ id: 'user-2' }) },
    );
    const body = (await response.json()) as { user: { name: string } };
    expect(body.user.name).toBe('Rahul Iyer');
  });

  it('requires a totp session for suspend and role changes', async () => {
    const sessionToken = await getSessionToken();

    const suspendResponse = await suspendUser(
      makeRequest('http://localhost/api/admin/users/user-4/suspend', {
        method: 'PATCH',
        headers: {
          cookie: 'skillhubcore_accessToken=token-super-admin',
          'content-type': 'application/json',
          'x-totp-session': sessionToken,
        },
        body: JSON.stringify({ reason: 'manual_review' }),
      }),
      { params: Promise.resolve({ id: 'user-4' }) },
    );
    expect(suspendResponse.status).toBe(200);

    const roleResponse = await changeRole(
      makeRequest('http://localhost/api/admin/users/user-4/role', {
        method: 'PATCH',
        headers: {
          cookie: 'skillhubcore_accessToken=token-super-admin',
          'content-type': 'application/json',
          'x-totp-session': sessionToken,
        },
        body: JSON.stringify({ role: 'admin' }),
      }),
      { params: Promise.resolve({ id: 'user-4' }) },
    );
    expect(roleResponse.status).toBe(200);
  });

  it('rejects sensitive actions without a totp session', async () => {
    const suspendResponse = await suspendUser(
      makeRequest('http://localhost/api/admin/users/user-4/suspend', {
        method: 'PATCH',
        headers: {
          cookie: 'skillhubcore_accessToken=token-super-admin',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'manual_review' }),
      }),
      { params: Promise.resolve({ id: 'user-4' }) },
    );
    expect(suspendResponse.status).toBe(428);
  });

  it('lists subscriptions and updates one', async () => {
    const listResponse = await getSubscriptions(
      makeRequest('http://localhost/api/admin/subscriptions', {
        headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
      }),
    );
    const listBody = (await listResponse.json()) as { subscriptions: unknown[] };
    expect(listBody.subscriptions.length).toBeGreaterThan(0);

    const sessionToken = await getSessionToken();
    const patchResponse = await updateSubscription(
      makeRequest('http://localhost/api/admin/subscriptions/sub-3', {
        method: 'PATCH',
        headers: {
          cookie: 'skillhubcore_accessToken=token-super-admin',
          'content-type': 'application/json',
          'x-totp-session': sessionToken,
        },
        body: JSON.stringify({ status: 'cancelled', plan: 'combo' }),
      }),
      { params: Promise.resolve({ id: 'sub-3' }) },
    );
    expect(patchResponse.status).toBe(200);
  });

  it('returns audit logs', async () => {
    const response = await getAuditLog(
      makeRequest('http://localhost/api/admin/audit-log?actor=Asha', {
        headers: { cookie: 'skillhubcore_accessToken=token-super-admin' },
      }),
    );
    const body = (await response.json()) as { logs: Array<{ actor: string }> };
    expect(body.logs.some((log) => log.actor === 'Asha Menon')).toBe(true);
  });
});
