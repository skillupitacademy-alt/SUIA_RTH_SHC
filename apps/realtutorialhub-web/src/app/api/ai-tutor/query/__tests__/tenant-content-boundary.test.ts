import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ verify: vi.fn(), incr: vi.fn(), expire: vi.fn(), vector: vi.fn(), complete: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: class { getAccessToken() { return 'fixture'; } static verifyAccessToken = f.verify; } }));
vi.mock('@quiz/db-tutorial', () => ({ STANDARD_QUERY_TIMEOUT: 1000, withTimeout: async (p: Promise<unknown>) => p, TutorialContentRepository: class {} }));
vi.mock('@upstash/redis', () => ({ Redis: class { incr = f.incr; expire = f.expire; } }));
vi.mock('@/lib/ai-tutor-vector', () => ({ queryAiTutorVector: f.vector }));
vi.mock('@/lib/ai-tutor-progress', () => ({ markAiTutorBlockComplete: f.complete }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { POST } from '../route';
const req = () => new Request('https://isolated.invalid/api/ai-tutor/query', { method: 'POST', body: JSON.stringify({ subtopicId: '11111111-1111-4111-8111-111111111111', question: 'What problem do promises solve?', difficulty: 'simple' }) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://isolated.invalid'); vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture'); f.incr.mockResolvedValue(1); f.expire.mockResolvedValue(1); f.vector.mockResolvedValue([]); f.complete.mockResolvedValue({}); });
it('denies a valid other-brand subject before effects', async () => {
  f.verify.mockResolvedValue({ userId: 'fixture', brand: 'skillup', roles: ['student'] });
  const result = await POST(req());
  expect(result.status).toBe(403);
  expect(f.incr).not.toHaveBeenCalled(); expect(f.complete).not.toHaveBeenCalled();
});
it('does not return global seeded answers for an unrelated subtopic', async () => {
  f.verify.mockResolvedValue({ userId: 'fixture', brand: 'realtutorialhub', roles: ['student'] });
  const result = await POST(req());
  expect(result.status).toBe(200);
  expect(await result.json()).not.toMatchObject({ source: 'qa_pairs' });
});

it('permits the intended brand to reach the isolated vector path', async () => {
  f.verify.mockResolvedValue({ userId: 'fixture', brand: 'realtutorialhub', roles: ['student'] });
  const request = new Request('https://isolated.invalid/api/ai-tutor/query', { method: 'POST', body: JSON.stringify({ subtopicId: '11111111-1111-4111-8111-111111111111', question: 'quartz topology', difficulty: 'simple' }) });
  const result = await POST(request);
  expect(result.status).toBe(200);
  expect(f.vector).toHaveBeenCalledOnce();
});
