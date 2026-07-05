import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../index';

  const env = {
    JWT_SECRET: 'gateway-secret',
    ADMIN_JWT_SECRET: 'gateway-secret',
    INTERNAL_GATEWAY_SECRET: 'internal-gateway-secret',
    SKILLHUBCORE_URL: 'https://skillhubcore.example.com',
    QUIZ_WEB_URL: 'https://quiz-web.example.com',
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

function makeToken(roles: string[] = ['student'], brand: 'realtutorialhub' | 'skillup' = 'realtutorialhub') {
  const tokenType = roles.some((role) => role.trim().toLowerCase() === 'admin' || role.trim().toLowerCase() === 'super_admin')
    ? 'admin'
    : 'user';
  const shadowUserId = tokenType === 'admin' ? 'shadow-admin-123' : 'shadow-user-123';
  const originalUserId = tokenType === 'admin' ? 'brand-admin-123' : 'brand-user-123';

  return new SignJWT({
    roles,
    subscriptions: ['combo'],
    tokenType,
    shadowUserId,
    originalUserId,
    brand,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(shadowUserId)
    .setAudience(tokenType === 'admin' ? 'admin' : 'user')
    .setIssuer('skillhubcore.in')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

beforeEach(() => {
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
          prefix: '/exam',
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
    const response = await app.request('https://api.example.com/auth/login', {
      headers: {
        Origin: 'https://quiz.skillhubcore.in',
      },
    }, env);
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Internal-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    expect(headers.get('X-Original-Host')).toBe('quiz.skillhubcore.in');
    expect(headers.get('X-Forwarded-Host')).toBe('api.example.com');
  });

  it('proxies public admin login routes without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/admin/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' }),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/admin/auth/login`);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Internal-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    expect(headers.get('X-User-ID')).toBeNull();
  });

  it.each([
    'user.realtutorialhub.com',
    'admin.realtutorialhub.com',
    'user.skillupitacademy.com',
    'admin.skillupitacademy.com',
    'faculty.skillupitacademy.com',
    'quiz.skillhubcore.in',
    'tutorial.skillhubcore.in',
  ])('does not proxy frontend host traffic through the Worker: %s', async (hostname) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request(`https://${hostname}/dashboard`, undefined, env);

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('routes placement host traffic to the placement upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://placement.skillhubcore.in/jobs', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.PLACEMENT_URL);
  });

  it('routes skillup api health checks to the api upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.skillupitacademy.com/api/health/live', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/health/live`);
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

  it('bypasses rate limiting for admin auth heartbeat routes', async () => {
    const token = await makeToken(['admin']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.example.com/admin/auth/heartbeat', {
      method: 'POST',
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
      body: JSON.stringify({}),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/admin/auth/heartbeat`);
  });

  it('routes skillhubcore api host traffic to the skillhubcore upstream', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 })); 
    const response = await app.request('https://api.skillhubcore.in/api/hierarchy/domains', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.SKILLHUBCORE_URL);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Brand')).toBe('realtutorialhub');
    expect(headers.get('X-Platform')).toBe('realtutorialhub');
    expect(headers.get('X-Portal-Identity')).toBe('user');
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
    ['exam list', 'GET', 'https://api.example.com/exam?range=7d&page=1&limit=3', '/api/exams?range=7d&page=1&limit=3'],
    ['exam metadata', 'GET', 'https://api.example.com/exam/metadata', '/api/exams/metadata'],
    ['exam breakdown', 'GET', 'https://api.example.com/exam/breakdown?range=28d', '/api/exams/breakdown?range=28d'],
    ['exam trend', 'GET', 'https://api.example.com/exam/trend?range=7d', '/api/exams/trend?range=7d'],
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
    expect(headers.get('X-Internal-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    if (label === 'telemetry' || label === 'search') {
      expect(headers.get('X-User-ID')).toBeNull();
    } else if (label.includes('factory') || label === 'system flags') {
      expect(headers.get('X-User-ID')).toBe('brand-admin-123');
    } else {
      expect(headers.get('X-User-ID')).toBe('brand-user-123');
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
    expect(headers.get('X-Internal-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    expect(headers.get('X-User-ID')).toBe('brand-user-123');
  });

  it('proxies user routes with accessToken cookies', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/exam', {
      headers: {
        cookie: `accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-User-ID')).toBe('brand-user-123');
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
    expect(headers.get('X-User-ID')).toBe('brand-admin-123');
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
        cookie: 'theme=dark; session_hint=jwt-cookie-token',
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('cookie')).toContain('session_hint=jwt-cookie-token');
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

  it('keeps protected routes available without gateway rate limiting', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

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
        Origin: 'https://tutorial.skillhubcore.in',
        'Access-Control-Request-Method': 'GET',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://tutorial.skillhubcore.in');
  });

  it('allows X-Brand in gateway preflight responses', async () => {
    const response = await app.request('https://api.example.com/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://admin.skillupitacademy.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-brand,x-portal-identity',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://admin.skillupitacademy.com');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Brand');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Portal-Identity');
  });

  it('falls back to the request host for original host when origin is absent', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.example.com/exam', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Original-Host')).toBe('api.example.com');
  });
});
