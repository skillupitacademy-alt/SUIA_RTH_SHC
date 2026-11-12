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
  it.each(['admin', 'super_admin'])('preserves the verified SHC Questions portal for %s', async role => {
    const token = await new SignJWT({
      userId: 'shc-principal', originalUserId: 'shc-principal', shadowUserId: 'shc-principal',
      roles: [role], isAdmin: true, tokenType: 'admin', brand: 'skillhubcore',
    }).setProtectedHeader({ alg: 'HS256' }).setIssuer('skillhubcore.in')
      .setAudience('shc-admin').setIssuedAt().setExpirationTime('5m')
      .sign(new TextEncoder().encode(env.ADMIN_JWT_SECRET));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const response = await app.request('http://127.0.0.1:8787/api/admin/questions?limit=1', {
      headers: {
        authorization: `Bearer ${token}`, 'x-portal-identity': 'shc-admin',
        'x-original-host': 'admin.skillhubcore.in', 'x-internal-secret': env.INTERNAL_GATEWAY_SECRET,
        'x-user-id': 'forged-user', 'x-user-roles': 'forged-role',
      },
    }, env);
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(`${env.EXAM_SERVICE_URL}/api/admin/questions?limit=1`);
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get('x-portal-identity')).toBe('shc-admin');
    expect(headers.get('x-user-id')).toBe('shc-principal');
    expect(headers.get('x-user-roles')).toBe(role);
  });

  it('ignores a forged SHC portal header on a tenant administrator token', async () => {
    const token = await makeToken(['admin']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const response = await app.request('https://api.realtutorialhub.com/api/admin/questions', {
      headers: { authorization: `Bearer ${token}`, 'x-portal-identity': 'shc-admin' },
    }, env);
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(new Headers((init as RequestInit).headers).get('x-portal-identity')).toBe('admin');
  });

  it('rejects a learner using forged SHC administrator headers before forwarding Questions', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const response = await app.request('https://api.realtutorialhub.com/api/admin/questions', {
      headers: {
        authorization: `Bearer ${token}`, 'x-portal-identity': 'shc-admin',
        'x-user-id': 'forged-admin', 'x-user-roles': 'super_admin',
      },
    }, env);
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns healthz without auth', async () => {
    const response = await app.request('https://api.realtutorialhub.com/healthz', undefined, env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
  });

  it('returns an internal health snapshot', async () => {
    const response = await app.request('https://api.realtutorialhub.com/internal/health', undefined, env);

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
    const response = await app.request('https://api.realtutorialhub.com/tutorial/lesson-1', undefined, env);
    expect(response.status).toBe(401);
  });

  it('proxies public auth routes without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.realtutorialhub.com/auth/login', {
      headers: {
        Origin: 'https://quiz.skillhubcore.in',
      },
    }, env);
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Internal-Secret')).toBe(env.INTERNAL_GATEWAY_SECRET);
    expect(headers.get('X-Original-Host')).toBe('api.realtutorialhub.com');
    expect(headers.get('X-Forwarded-Host')).toBe('api.realtutorialhub.com');
  });

  it('proxies public admin login routes without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.realtutorialhub.com/admin/auth/login', {
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

  it('routes skillup user host traffic to the skillup web upstream while frontend Worker routes remain active', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://user.skillupitacademy.com/programs', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.SKILLUP_WEB_URL);
  });

  it('routes rth user host traffic to the tutorial upstream while frontend Worker routes remain active', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://user.realtutorialhub.com/learn/remediation', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.TUTORIAL_SERVICE_URL);
  });

  it('routes rth placement handoff API to the frontend app route', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://user.realtutorialhub.com/api/auth/placement-handoff', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ redirectTo: '/profile' }),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.TUTORIAL_SERVICE_URL}/api/auth/placement-handoff`);
  });

  it('routes skillup placement handoff API to the frontend app route', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://user.skillupitacademy.com/api/auth/placement-handoff', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ redirectTo: '/profile' }),
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.SKILLUP_WEB_URL}/api/auth/placement-handoff`);
  });

  it('routes quiz host traffic to the quiz web upstream while frontend Worker routes remain active', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://quiz.skillhubcore.in/dashboard', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(env.QUIZ_WEB_URL);
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
    const response = await app.request('https://api.realtutorialhub.com/admin/auth/me', {
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
    const response = await app.request('https://api.realtutorialhub.com/admin/auth/heartbeat', {
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

  it('rejects a tenant learner token on the skillhubcore api host', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 })); 
    const response = await app.request('https://api.skillhubcore.in/api/hierarchy/domains', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('routes public telemetry without jwt', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
    const response = await app.request('https://api.realtutorialhub.com/telemetry', {
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
    ['exam list', 'GET', 'https://api.realtutorialhub.com/exam?range=7d&page=1&limit=3', '/api/exams?range=7d&page=1&limit=3'],
    ['exam metadata', 'GET', 'https://api.realtutorialhub.com/exam/metadata', '/api/exams/metadata'],
    ['exam breakdown', 'GET', 'https://api.realtutorialhub.com/exam/breakdown?range=28d', '/api/exams/breakdown?range=28d'],
    ['exam trend', 'GET', 'https://api.realtutorialhub.com/exam/trend?range=7d', '/api/exams/trend?range=7d'],
    ['telemetry', 'POST', 'https://api.realtutorialhub.com/telemetry', '/api/telemetry'],
    ['reports list', 'GET', 'https://api.realtutorialhub.com/reports', '/api/reports'],
    ['analytics score history', 'GET', 'https://api.realtutorialhub.com/analytics/user/score-history', '/api/analytics/user/score-history'],
    ['analytics mastery trend', 'GET', 'https://api.realtutorialhub.com/analytics/user/mastery-trend', '/api/analytics/user/mastery-trend'],
    ['recommendations explain', 'GET', 'https://api.realtutorialhub.com/recommendations/explain', '/api/recommendations/explain'],
    ['search', 'GET', 'https://api.realtutorialhub.com/search?q=algebra&type=all', '/api/search?q=algebra&type=all'],
    ['export urls', 'GET', 'https://api.realtutorialhub.com/export/urls?examId=exam-1&format=json', '/api/export/urls?examId=exam-1&format=json'],
    ['export status', 'GET', 'https://api.realtutorialhub.com/export/status/job-1?examId=exam-1&format=json', '/api/export/status/job-1?examId=exam-1&format=json'],
    ['export trigger', 'POST', 'https://api.realtutorialhub.com/export/trigger', '/api/export/trigger'],
    ['report status', 'GET', 'https://api.realtutorialhub.com/report-status?attemptId=attempt-1', '/api/report-status?attemptId=attempt-1'],
    ['queue report', 'POST', 'https://api.realtutorialhub.com/queue-report', '/api/queue-report'],
    ['notifications unread count', 'GET', 'https://api.realtutorialhub.com/notifications/unread-count', '/api/notifications/unread-count'],
    ['factory duplicate check', 'POST', 'https://api.realtutorialhub.com/factory/check-duplicates', '/api/factory/check-duplicates'],
    ['factory save', 'POST', 'https://api.realtutorialhub.com/factory/save', '/api/factory/save'],
    ['system flags', 'GET', 'https://api.realtutorialhub.com/system/flags', '/api/system/flags'],
    ['tutor help request', 'POST', 'https://api.realtutorialhub.com/tutor/help/request', '/api/tutor/help/request'],
    ['tutor notes request', 'POST', 'https://api.realtutorialhub.com/tutor/notes/request', '/api/tutor/notes/request'],
    ['adaptive exam start', 'POST', 'https://api.realtutorialhub.com/exams/adaptive/start', '/api/exams/adaptive/start'],
    ['domains', 'GET', 'https://api.realtutorialhub.com/domains?domainId=d1', '/api/domains?domainId=d1'],
    ['subjects', 'GET', 'https://api.realtutorialhub.com/subjects?domainId=d1', '/api/subjects?domainId=d1'],
    ['topics', 'GET', 'https://api.realtutorialhub.com/topics?subjectId=s1', '/api/topics?subjectId=s1'],
    ['subtopics', 'GET', 'https://api.realtutorialhub.com/subtopics?topicId=t1', '/api/subtopics?topicId=t1'],
    ['quiz count', 'POST', 'https://api.realtutorialhub.com/quiz/count', '/api/quiz/count'],
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
    const response = await app.request('https://api.realtutorialhub.com/search?q=algebra&type=all', undefined, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(`${env.EXAM_SERVICE_URL}/api/search?q=algebra&type=all`);
  });

  it('proxies valid jwt with user headers', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.realtutorialhub.com/tutorial/lessons/1', {
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

    const response = await app.request('https://api.realtutorialhub.com/exam', {
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

    const response = await app.request('https://api.realtutorialhub.com/admin/users', {
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
    const response = await app.request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `accessToken=${encodeURIComponent(token)}`,
      },
    }, env);

    expect(response.status).toBe(401);
  });

  it('preserves cookie auth headers when proxying protected routes', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.realtutorialhub.com/tutorial/lessons/1', {
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
    const response = await app.request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(403);
  });

  it('keeps protected routes available without gateway rate limiting', async () => {
    const token = await makeToken(['student']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await app.request('https://api.realtutorialhub.com/tutorial/lessons/1', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('blocks disallowed cors origins', async () => {
    const response = await app.request('https://api.realtutorialhub.com/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('allows configured cors origins', async () => {
    const response = await app.request('https://api.realtutorialhub.com/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://tutorial.skillhubcore.in',
        'Access-Control-Request-Method': 'GET',
      },
    }, env);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://tutorial.skillhubcore.in');
  });

  it('allows X-Brand in gateway preflight responses', async () => {
    const response = await app.request('https://api.realtutorialhub.com/auth/login', {
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

    const response = await app.request('https://api.realtutorialhub.com/exam', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }, env);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('X-Original-Host')).toBe('api.realtutorialhub.com');
  });
});
