import { afterEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ programs: vi.fn(async () => ({ programs: ['private-fixture'] })), faculty: vi.fn(async () => ({ faculty: ['private-fixture'] })), detail: vi.fn() }));
vi.mock('../skillup-data', () => ({ getSkillupPrograms: calls.programs, getSkillupFaculty: calls.faculty, getSkillupProgramDetail: calls.detail }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
import { fetchSkillupApi } from '../skillup-api';
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('returns successful upstream data without direct fallback', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ programs: ['public-fixture'] }), { status: 200 })));
  await expect(fetchSkillupApi('/api/programs')).resolves.toEqual({ programs: ['public-fixture'] });
  expect(calls.programs).not.toHaveBeenCalled();
});
it.each([['/api/programs', 401, calls.programs], ['/api/faculty', 403, calls.faculty]])('does not bypass HTTP %s denial', async (path, status, fallback) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
  await expect(fetchSkillupApi(path)).rejects.toThrow();
  expect(fallback).not.toHaveBeenCalled();
});
