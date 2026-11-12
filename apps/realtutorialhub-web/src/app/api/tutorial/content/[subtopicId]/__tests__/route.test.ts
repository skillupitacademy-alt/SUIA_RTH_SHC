import { expect, it, vi } from 'vitest';
import { GET } from '../route';

it('returns 410 Gone with Cache-Control: private, no-store and static message without upstream calls or parameter reflection', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);

  const response = await GET(
    new Request('https://realtutorialhub.localhost:3003/api/tutorial/content/untrusted-subtopic-canary', {
      headers: { 'x-user-id': 'rth-user-canary' },
    }) as Parameters<typeof GET>[0],
    { params: Promise.resolve({ subtopicId: 'untrusted-subtopic-canary' }) },
  );

  expect(response.status).toBe(410);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  const body = await response.json();
  expect(body).toEqual({
    error: 'Gone',
    message: 'Legacy tutorial content route is permanently retired. Use canonical /tutorial-v2 block routes.',
    statusCode: 410,
  });
  expect(JSON.stringify(body)).not.toContain('untrusted-subtopic-canary');
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('rth-user-canary');
  expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('untrusted-subtopic-canary');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

