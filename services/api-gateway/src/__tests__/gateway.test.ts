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
  UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
  UPSTASH_REDIS_REST_TOKEN: 'redis-token',
  SKILLHUBCORE_URL: 'https://skillhubcore.example.com',
  SKILLUP_WEB_URL: 'https://skillup-web.example.com',
  SKILLUP_ADMIN_URL: 'https://skillup-admin.example.com',
  FACULTY_URL: 'https://faculty.example.com',
  STUDENT_FACULTY_URL: 'https://student-faculty.example.com',
  EXAM_SERVICE_URL: 'https://exam.example.com',
  TUTORIAL_SERVICE_URL: 'https://tutorial.example.com',
  PAYMENT_SERVICE_URL: 'https://payment.example.com',
  CRM_SERVICE_URL: 'https://crm.example.com',
  NOTIFICATION_URL: 'https://notifications.example.com',
  PLACEMENT_URL: 'https://placement.example.com',
} as const;

function makeToken(roles: string[] = ['student']) {
  const tokenType = roles.some((role) => role.trim().toLowerCase() === 'admin' || role.trim().toLowerCase() === 'super_admin')
    ? 'admin'
    : 'user';

  return new SignJWT({
    roles,
    subscriptions: ['combo'],
    tokenType,
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

  it('returns an internal health snapshot', async () => {
    const response = await app.request('https://api.example.com/internal/health', undefined, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      services: expect.objectContaining({
        EXAM_SERVICE_URL: { status: 'configured', url: env.EXAM_SERVICE_URL },
      }),
      routes: expect.arrayContaining([
        expect.objectContaining({
          prefix: '/dashboard',
          upstreamKey: 'EXAM_SERVICE_URL',
          bindingStatus: 'configured',
        }),
      ]),
    });
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

  it('routes skillup web host traffic to the skillup web upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://skillupitacademy.com/programs', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.SKILLUP_WEB_URL);
  });

  it('routes skillup admin host traffic to the skillup admin upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://admin.skillupitacademy.com/dashboard', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.SKILLUP_ADMIN_URL);
  });

  it('routes faculty host traffic to the faculty upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://faculty.skillupitacademy.com/dashboard', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.FACULTY_URL);
  });

  it('routes admin api traffic to the exam service upstream', async () => {
    const token = await makeToken(['admin']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/admin/auth/me', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/admin/auth/me`);
  });

  it('routes skillhubcore api host traffic to the skillhubcore upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 })); 
    const response = await app.request('https://api.skillhubcore.in/api/hierarchy/domains', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.SKILLHUBCORE_URL);
  });

  it('routes public telemetry without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/telemetry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ event: 'client_event' }),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/telemetry`);
  });

  it.each([
    ['dashboard', 'GET', 'https://api.example.com/dashboard?range=7d&page=1&limit=3', '/api/dashboard?range=7d&page=1&limit=3'],
    ['dashboard metadata', 'GET', 'https://api.example.com/dashboard/metadata', '/api/dashboard/metadata'],
    ['dashboard breakdown', 'GET', 'https://api.example.com/dashboard/breakdown?range=28d', '/api/dashboard/breakdown?range=28d'],
    ['dashboard trend', 'GET', 'https://api.example.com/dashboard/trend?range=7d', '/api/dashboard/trend?range=7d'],
    ['telemetry', 'POST', 'https://api.example.com/telemetry', '/api/telemetry'],
    ['reports list', 'GET', 'https://api.example.com/reports', '/api/reports'],
    ['analytics score history', 'GET', 'https://api.example.com/analytics/user/score-history', '/api/analytics/user/score-history'],
    ['analytics mastery trend', 'GET', 'https://api.example.com/analytics/user/mastery-trend', '/api/analytics/user/mastery-trend'],
    ['recommendations explain', 'GET', 'https://api.example.com/recommendations/explain', '/api/recommendations/explain'],
    ['search', 'GET', 'https://api.example.com/search?q=algebra&type=all', '/api/search?q=algebra&type=all'],
    ['export urls', 'GET', 'https://api.example.com/export/urls?examId=exam-1&format=json', '/api/export/urls?examId=exam-1&format=json'],
    ['export status', 'GET', 'https://api.example.com/export/status/job-1?examId=exam-1&format=json', '/api/export/status/job-1?examId=exam-1&format=json'],
    ['export trigger', 'POST', 'https://api.example.com/export/trigger', '/api/export/trigger'],
    ['report status', 'GET', 'https://api.example.com/report-status?attemptId=attempt-1', '/api/report-status?attemptId=attempt-1'],
    ['queue report', 'POST', 'https://api.example.com/queue-report', '/api/queue-report'],
    ['notifications unread count', 'GET', 'https://api.example.com/notifications/unread-count', '/api/notifications/unread-count'],
    ['factory duplicate check', 'POST', 'https://api.example.com/factory/check-duplicates', '/api/factory/check-duplicates'],
    ['factory save', 'POST', 'https://api.example.com/factory/save', '/api/factory/save'],
    ['system flags', 'GET', 'https://api.example.com/system/flags', '/api/system/flags'],
    ['tutor help request', 'POST', 'https://api.example.com/tutor/help/request', '/api/tutor/help/request'],
    ['tutor notes request', 'POST', 'https://api.example.com/tutor/notes/request', '/api/tutor/notes/request'],
    ['adaptive exam start', 'POST', 'https://api.example.com/exams/adaptive/start', '/api/exams/adaptive/start'],
    ['domains', 'GET', 'https://api.example.com/domains?domainId=d1', '/api/domains?domainId=d1'],
    ['subjects', 'GET', 'https://api.example.com/subjects?domainId=d1', '/api/subjects?domainId=d1'],
    ['topics', 'GET', 'https://api.example.com/topics?subjectId=s1', '/api/topics?subjectId=s1'],
    ['subtopics', 'GET', 'https://api.example.com/subtopics?topicId=t1', '/api/subtopics?topicId=t1'],
    ['quiz count', 'POST', 'https://api.example.com/quiz/count', '/api/quiz/count'],
  ] as const)('rewrites quiz hierarchy route: %s', async (label, method, url, expectedPath) => {
    const token = await makeToken(label.includes('factory') || label.includes('system') ? ['admin'] : ['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
      },
      ...(method === 'POST' ? { body: JSON.stringify({ domainId: 'd1' }) } : {}),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const upstreamBase = label === 'notifications unread count' ? env.NOTIFICATION_URL : env.EXAM_SERVICE_URL;
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${upstreamBase}${expectedPath}`);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Gateway-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    if (label === 'telemetry' || label === 'search') {
      expect(headers.get('X-User-ID')).toBeNull();
    } else {
      expect(headers.get('X-User-ID')).toBe('user-123');
    }
  });

  it('routes public search without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/search?q=algebra&type=all', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/search?q=algebra&type=all`);
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

  it('proxies user routes with accessToken cookies', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/dashboard', {
      headers: {
        cookie: `accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-User-ID')).toBe('user-123');
  });

  it('proxies admin routes with admin_accessToken cookies', async () => {
    const token = await makeToken(['admin']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-User-ID')).toBe('user-123');
  });

  it('rejects admin routes without admin_accessToken cookies', async () => {
    const token = await makeToken(['admin']);
    const response = await app.request('https://api.example.com/admin/users', {
      headers: {
        cookie: `accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(401);
  });

  it('preserves cookie auth headers when proxying protected routes', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
        cookie: 'skillhubcore_accessToken=jwt-cookie-token; theme=dark',
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('cookie')).toContain('skillhubcore_accessToken=jwt-cookie-token');
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

  it('skips rate limiting when redis config is missing', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, {
      ...env,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    } as unknown as typeof env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
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
