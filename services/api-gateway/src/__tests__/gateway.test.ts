import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../index';

const rateLimitState = new Map<string, number>();

vi.mock('@upstash/redis', () => {
  return {
    Redis: class Redis {
      constructor(_: unknown) {}
    },
  };
});

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: class Ratelimit {
      static slidingWindow(limit: number, window: string) {
        return { limit, window };
      }

      constructor(_: unknown) {}

      async limit(key: string) {
        const count = (rateLimitState.get(key) ?? 0) + 1;
        rateLimitState.set(key, count);
        if (count > 100) {
          return {
            success: false,
            remaining: 0,
            reset: Date.now() + 60_000,
          };
        }

        return {
          success: true,
          remaining: Math.max(0, 100 - count),
          reset: Date.now() + 60_000,
        };
      }
    },
  };
});

const env = {
  JWT_SECRET: 'gateway-secret',
  INTERNAL_GATEWAY_SECRET: 'internal-gateway-secret',
  UPSTASH_REDIS_URL: 'https://redis.example.com',
  UPSTASH_REDIS_TOKEN: 'redis-token',
  SKILLHUBCORE_URL: 'https://skillhubcore.example.com',
  STUDENT_FACULTY_URL: 'https://student-faculty.example.com',
  EXAM_SERVICE_URL: 'https://exam.example.com',
  TUTORIAL_SERVICE_URL: 'https://tutorial.example.com',
  PAYMENT_SERVICE_URL: 'https://payment.example.com',
  CRM_SERVICE_URL: 'https://crm.example.com',
  NOTIFICATION_URL: 'https://notifications.example.com',
  PLACEMENT_URL: 'https://placement.example.com',
  ADMIN_URL: 'https://admin.example.com',
} as const;

function makeToken(roles: string[] = ['student']) {
  return new SignJWT({
    roles,
    subscriptions: ['combo'],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('user-123')
    .setIssuer('skillhubcore.in')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

beforeEach(() => {
  rateLimitState.clear();
  vi.restoreAllMocks();
});

describe('api-gateway', () => {
  it('returns healthz without auth', async () => {
    const response = await app.request('https://api.example.com/healthz', undefined, env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
  });

  it('rejects missing jwt on protected routes', async () => {
    const response = await app.request('https://api.example.com/tutorial/lesson-1', undefined, env);
    expect(response.status).toBe(401);
  });

  it('proxies public auth routes without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/auth/login', undefined, env);
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Gateway-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
  });

  it('proxies valid jwt with user headers', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-request-id': 'request-123',
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Request-ID')).toBe('request-123');
    expect(headers.get('X-Gateway-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    expect(headers.get('X-User-ID')).toBe('user-123');
  });

  it('forbids admin route for non-admin roles', async () => {
    const token = await makeToken(['student']);
    const response = await app.request('https://api.example.com/admin/users', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(403);
  });

  it('rate limits the 101st request', async () => {
    const token = await makeToken(['student']);
    rateLimitState.set('203.0.113.1', 100);

    const blocked = await app.request('https://api.example.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
        'cf-connecting-ip': '203.0.113.1',
      },
    }, env);
    expect(blocked.status).toBe(429);
  });

  it('blocks disallowed cors origins', async () => {
    const response = await app.request('https://api.example.com/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('allows configured cors origins', async () => {
    const response = await app.request('https://api.example.com/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://notes.realtutorialhub.com',
        'Access-Control-Request-Method': 'GET',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://notes.realtutorialhub.com');
  });
});
