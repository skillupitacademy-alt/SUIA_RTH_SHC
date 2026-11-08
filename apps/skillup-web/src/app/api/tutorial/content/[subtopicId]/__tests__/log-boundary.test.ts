import { expect, it, vi } from 'vitest';
vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: vi.fn().mockResolvedValue({ ok: true, userId: 'fixture-user-sensitive' }) }));
import { GET } from '../route';
it('does not log learner or subtopic on a successful legacy content read', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [] }), { status: 200 })));
  await GET(new Request('https://fixture.invalid') as Parameters<typeof GET>[0], { params: Promise.resolve({ subtopicId: 'fixture-subtopic-sensitive' }) });
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('fixture-user-sensitive');
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('fixture-subtopic-sensitive');
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});
