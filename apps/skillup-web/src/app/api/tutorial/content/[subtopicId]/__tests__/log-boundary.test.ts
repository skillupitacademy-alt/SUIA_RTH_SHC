import { expect, it, vi } from 'vitest';
import { GET } from '../route';

it('returns 410 Gone without upstream fetches or logging learner/subtopic identifiers', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);

  const response = await GET(
    new Request('https://fixture.invalid', {
      headers: { 'x-user-id': 'fixture-user-sensitive' },
    }) as Parameters<typeof GET>[0],
    { params: Promise.resolve({ subtopicId: 'fixture-subtopic-sensitive' }) },
  );

  expect(response.status).toBe(410);
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('fixture-user-sensitive');
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('fixture-subtopic-sensitive');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
