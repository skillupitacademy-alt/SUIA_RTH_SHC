import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  select: vi.fn(), rows: vi.fn(), token: vi.fn(), verify: vi.fn(), brand: vi.fn(),
  report: vi.fn(), exists: vi.fn(), increment: vi.fn(), generate: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  db: { select: state.select }, exams: { id: 'exams.id', userId: 'exams.userId' },
}));
vi.mock('@quiz/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@quiz/auth')>(), validateBrandOrThrow: state.brand,
}));
vi.mock('@/modules/auth/token.service', () => ({ TokenService: class {} }));
vi.mock('@/modules/core/container', () => ({
  container: { get: () => ({ getAccessToken: state.token, verifyUserAccessToken: state.verify }) },
}));
vi.mock('@/modules/core/resilience.manager', () => ({ resilienceManager: { isHighLoad: () => false } }));
vi.mock('@/modules/core/cache.service', () => ({ cacheService: { increment: state.increment } }));
vi.mock('@/modules/report-engine/report-repository', () => ({ ReportRepository: { getReportByAttempt: state.report } }));
vi.mock('@/modules/report-engine/report-pdf.service', () => ({ ReportPdfService: { generate: state.generate } }));
vi.mock('@/modules/report-engine/performance.service', () => ({ PerformanceService: class {} }));
vi.mock('@/services/reports/ReportJobService', () => ({ ReportJobService: { createJob: vi.fn() } }));
vi.mock('@/lib/storage', () => ({ storage: { exists: state.exists } }));
vi.mock('@/lib/storage/upload-report', () => ({ uploadReport: vi.fn() }));
vi.mock('@/lib/redis', () => ({ redis: { set: vi.fn(), del: vi.fn() } }));
vi.mock('@/lib/metrics', () => ({ recordCounter: vi.fn(), recordTimer: vi.fn() }));

import { POST } from '../route';

function request(key?: string) {
  return new NextRequest('http://localhost:3000/api/generate-report', {
    method: 'POST', body: JSON.stringify({ attemptId: 'exam-1' }),
    headers: key === undefined ? {} : { 'x-internal-key': key },
  });
}

describe('existing report receiver authentication and ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of Object.values(state)) mock.mockReset();
    vi.stubEnv('INTERNAL_API_KEY', 'p0-disposable-receiver-key');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api');
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Outbound HTTP forbidden in receiver unit tests'); }));
    state.rows.mockResolvedValue([{ userId: 'owner-1', status: 'completed', reportMaterialized: null }]);
    state.select.mockImplementation(() => ({ from: () => ({ where: () => ({ limit: state.rows }) }) }));
    state.token.mockReturnValue(null);
    state.report.mockResolvedValue({ status: 'ready', fileRef: 'synthetic-file' });
    state.exists.mockResolvedValue(true);
    state.increment.mockResolvedValue({ count: 1, ttlRem: 60 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([undefined, '', 'incorrect-disposable-key'])('denies absent or incorrect internal credential %j without a user token', async key => {
    expect((await POST(request(key), undefined)).status).toBe(401);
    expect(state.select).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not admit an internal request when the configured secret is absent', async () => {
    vi.stubEnv('INTERNAL_API_KEY', undefined);
    expect((await POST(request('p0-disposable-receiver-key'), undefined)).status).toBe(401);
    expect(state.select).not.toHaveBeenCalled();
  });

  it('allows the configured internal key and resolves the persisted exam owner', async () => {
    const response = await POST(request('p0-disposable-receiver-key'), undefined);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ cached: true });
    expect(state.select).toHaveBeenCalledTimes(2);
    expect(state.verify).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the verified learner path for an owned completed exam', async () => {
    state.token.mockReturnValue('controlled-user-token');
    state.verify.mockResolvedValue({ userId: 'owner-1', brand: 'skillup' });
    expect((await POST(request(), undefined)).status).toBe(200);
    expect(state.brand).toHaveBeenCalledOnce();
    expect(state.generate).not.toHaveBeenCalled();
  });

  it('denies a verified learner requesting another owner’s report', async () => {
    state.token.mockReturnValue('controlled-user-token');
    state.verify.mockResolvedValue({ userId: 'foreign-user', brand: 'skillup' });
    expect((await POST(request(), undefined)).status).toBe(403);
    expect(state.report).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
  });

  it('preserves current completed-exam eligibility for internal requests', async () => {
    state.rows.mockResolvedValue([{ userId: 'owner-1', status: 'started', reportMaterialized: null }]);
    expect((await POST(request('p0-disposable-receiver-key'), undefined)).status).toBe(400);
    expect(state.report).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
  });
});
