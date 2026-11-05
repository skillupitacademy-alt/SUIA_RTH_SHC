import { afterEach, expect, it, vi } from 'vitest';
import { ProjectLlmClient } from '../projectLlmClient';
afterEach(() => vi.unstubAllGlobals());
it('returns an existing contract without generating', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ contract_hash: 'fixture' }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(new ProjectLlmClient('/api/project-llm').getEngineeringContract('workflow')).resolves.toMatchObject({ contract_hash: 'fixture' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1].method).toBe('GET');
});
it('currently attempts generation after missing contract', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify({ contract_hash: 'generated-fixture' }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(new ProjectLlmClient('/api/project-llm').getEngineeringContract('workflow')).resolves.toMatchObject({ contract_hash: 'generated-fixture' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[0][1].method).toBe('GET');
  expect(fetchMock.mock.calls[1][1].method).toBe('POST');
});
