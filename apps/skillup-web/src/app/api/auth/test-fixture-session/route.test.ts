import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TokenService } from '@quiz/auth';
import { POST } from './route';

vi.mock('@quiz/auth', () => ({ TokenService: { generateAccessToken: vi.fn().mockResolvedValue('test-only-token') } }));

const secret = 'test-only-fixture-secret-not-a-real-secret';
const learner = '33333333-3333-4333-8333-333333333333';
function request(header = secret) {
  return new NextRequest('http://skillup.localhost:3100/api/auth/test-fixture-session', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-project-llm-fixture-secret': header },
    body: JSON.stringify({ fixtureId: 'fixture', tenant: 'skillup' }),
  });
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('ENVIRONMENT', 'development');
  vi.stubEnv('APP_ENV', 'development');
  vi.stubEnv('VERCEL_ENV', 'development');
  vi.stubEnv('PROJECT_LLM_LEARNER_RUNTIME_ENABLED', 'true');
  vi.stubEnv('PROJECT_LLM_ISOLATED_VERIFICATION', 'true');
  vi.stubEnv('PROJECT_LLM_FIXTURE_SESSION_SECRET', secret);
  vi.stubEnv('PROJECT_LLM_TEST_TENANT', 'skillup');
  vi.stubEnv('PROJECT_LLM_TEST_FIXTURE_IDS', 'fixture');
  vi.stubEnv('PROJECT_LLM_TEST_LEARNER_ID', learner);
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('isolated learner fixture session', () => {
  it('uses learner-compatible audience, platform and UUID claims in development', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(TokenService.generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
      userId: learner, shadowUserId: learner, aud: 'user', brand: 'skillup', platforms: ['skillup'],
    }), '15m');
  });
  it('never enables fixture auth on a production deployment', async () => {
    vi.stubEnv('ENVIRONMENT', 'production');
    expect((await POST(request())).status).toBe(403);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it('rejects a normal next start process without the isolation guard', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PROJECT_LLM_ISOLATED_VERIFICATION', 'false');
    expect((await POST(request())).status).toBe(403);
  });

  it('rejects a production process even when the isolated-preview flag is enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect((await POST(request())).status).toBe(403);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it.each(['VERCEL_ENV', 'APP_ENV', 'ENVIRONMENT'])('rejects the production deployment label %s', async name => {
    vi.stubEnv(name, 'production');
    expect((await POST(request())).status).toBe(403);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it('requires explicit runtime enablement', async () => {
    vi.stubEnv('PROJECT_LLM_LEARNER_RUNTIME_ENABLED', 'false');
    expect((await POST(request())).status).toBe(403);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it.each(['', 'short'])('fails closed for missing or weak configuration', async key => {
    vi.stubEnv('PROJECT_LLM_FIXTURE_SESSION_SECRET', key);
    expect((await POST(request())).status).toBe(503);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it('rejects an unknown fixture', async () => {
    vi.stubEnv('PROJECT_LLM_TEST_FIXTURE_IDS', 'other');
    expect((await POST(request())).status).toBe(400);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it('rejects a foreign configured tenant', async () => {
    vi.stubEnv('PROJECT_LLM_TEST_TENANT', 'realtutorialhub');
    expect((await POST(request())).status).toBe(400);
    expect(TokenService.generateAccessToken).not.toHaveBeenCalled();
  });
  it('rejects an incorrect fixture secret', async () => {
    expect((await POST(request('wrong'))).status).toBe(403);
  });
  it('rejects missing fixture learner identity', async () => {
    vi.stubEnv('PROJECT_LLM_TEST_LEARNER_ID', '');
    expect((await POST(request())).status).toBe(503);
  });
});
