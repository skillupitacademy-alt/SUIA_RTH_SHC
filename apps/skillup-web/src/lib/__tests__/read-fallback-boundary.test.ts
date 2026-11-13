import { afterEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ programs: vi.fn(async () => ({ programs: ['private-fixture'] })), faculty: vi.fn(async () => ({ faculty: ['private-fixture'] })), detail: vi.fn() }));
vi.mock('../skillup-data', () => ({ getSkillupPrograms: calls.programs, getSkillupFaculty: calls.faculty, getSkillupProgramDetail: calls.detail }));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));
import { headers } from 'next/headers';
import { fetchSkillupApi } from '../skillup-api';
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('returns successful upstream data without direct fallback', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ programs: ['public-fixture'] }), { status: 200 })));
  await expect(fetchSkillupApi('/api/programs')).resolves.toEqual({ programs: ['public-fixture'] });
  expect(calls.programs).not.toHaveBeenCalled();
});
it('uses the configured internal gateway credential for its own protected BFF', async () => {
  vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'internal-fixture-secret');
  vi.stubEnv('GATEWAY_TRUST_SECRET', 'different-upstream-secret');
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ attendance: [] }));
  vi.stubGlobal('fetch', fetchMock);
  try {
    await fetchSkillupApi('/api/student/attendance');
    expect(fetchMock.mock.calls[0][1].headers.get('x-gateway-secret')).toBe('internal-fixture-secret');
  } finally { vi.unstubAllEnvs(); }
});
it.each([['/api/programs', 401, calls.programs], ['/api/faculty', 403, calls.faculty]])('does not bypass HTTP %s denial', async (path, status, fallback) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
  await expect(fetchSkillupApi(path)).rejects.toThrow();
  expect(fallback).not.toHaveBeenCalled();
});
it.each([['/api/programs', 403, calls.programs], ['/api/faculty', 401, calls.faculty]])('does not fall back on alternate denial', async (path, status, fallback) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
  await expect(fetchSkillupApi(path)).rejects.toThrow();
  expect(fallback).not.toHaveBeenCalled();
});
it('retains existing 5xx and transport fallback behavior', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockRejectedValueOnce(new Error('offline fixture')));
  await expect(fetchSkillupApi('/api/programs')).resolves.toEqual({ programs: ['private-fixture'] });
  await expect(fetchSkillupApi('/api/faculty')).resolves.toEqual({ faculty: ['private-fixture'] });
});
it('does not use direct fallback for protected student paths', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline fixture')));
  await expect(fetchSkillupApi('/api/student/dashboard')).rejects.toThrow();
  expect(calls.programs).not.toHaveBeenCalled();
  expect(calls.faculty).not.toHaveBeenCalled();
});

it('propagates missing request context before network or database access', async () => {
  const requestScopeError = new Error('Request context unavailable');
  vi.mocked(headers).mockRejectedValueOnce(requestScopeError);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(fetchSkillupApi('/api/faculty')).rejects.toBe(requestScopeError);
  expect(fetch).not.toHaveBeenCalled();
  expect(calls.faculty).not.toHaveBeenCalled();
});
