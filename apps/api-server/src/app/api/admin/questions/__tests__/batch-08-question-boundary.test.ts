import { NextRequest } from 'next/server';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryBus } from '@/lib/cqrs';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET, POST } from '../route';
import { AdminQuestionEngine } from '@/modules/admin-engine/admin.question.engine';

vi.mock('@/modules/auth/rbac.service', () => ({ _verifyAdmin: vi.fn(), _verifyActiveAccount: vi.fn() }));
vi.mock('@/lib/cqrs', () => ({ bootstrapCQRS: vi.fn(), GetQuestionsQuery: class { constructor(..._args: unknown[]) {} }, queryBus: { dispatch: vi.fn() } }));
vi.mock('@/modules/admin-engine/admin.question.engine', () => ({ AdminQuestionEngine: class {} }));
const key = new TextEncoder().encode('admin-questions-isolated-key-32bytes!');
const service = new TokenService(key, key, key);
const previous = container.get(TokenService);
async function request(type: 'admin' | 'user') {
  const token = await service.generateAccessToken({ userId: 'principal', originalUserId: 'principal', shadowUserId: 'principal',
    email: 'principal@example.test', roles: [type === 'admin' ? 'admin' : 'student'], isAdmin: type === 'admin',
    brand: 'skillhubcore', tokenType: type, aud: type === 'admin' ? 'shc-admin' : 'user' });
  return new NextRequest('http://localhost/api/admin/questions', { headers: { authorization: `Bearer ${token}`, 'x-portal-identity': 'shc-admin' } });
}
describe('admin question CQRS handler effect boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); container.register(TokenService, service); vi.mocked(queryBus.dispatch).mockResolvedValue({ questions: [], total: 0, nextCursor: null, limit: 20 } as never); });
  afterEach(() => container.register(TokenService, previous));
  it('allows SHC admin to dispatch one question query', async () => {
    const response = await GET(await request('admin'), undefined);
    expect(response.status).toBe(200); expect(queryBus.dispatch).toHaveBeenCalledTimes(1);
  });
  it('reproduces the missing portal header 401 over HTTP with a real signed SHC token', async () => {
    const server = createServer(async (incoming, outgoing) => {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(',') : value);
      }
      const response = await GET(new NextRequest(`http://localhost${incoming.url}`, { headers }), undefined);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (address === null || typeof address === 'string') throw new Error('HTTP listener unavailable');
      const url = `http://127.0.0.1:${address.port}/api/admin/questions`;
      const valid = await request('admin');
      const authorization = valid.headers.get('authorization')!;
      const missing = await fetch(url, { headers: { authorization } });
      expect(missing.status).toBe(401);
      expect(queryBus.dispatch).not.toHaveBeenCalled();
      const admitted = await fetch(url, { headers: { authorization, 'x-portal-identity': 'shc-admin' } });
      expect(admitted.status).toBe(200);
      expect(queryBus.dispatch).toHaveBeenCalledTimes(1);
      const learner = await request('user');
      const rejected = await fetch(url, { headers: learner.headers });
      expect(rejected.status).toBe(401);
      expect(queryBus.dispatch).toHaveBeenCalledTimes(1);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    }
  });
  it('denies learner mutation and propagates the verified SHC actor on valid create', async () => {
    const createQuestion = vi.fn(async () => ({ id: 'question' }));
    const previousEngine = container.get(AdminQuestionEngine);
    container.register(AdminQuestionEngine, { createQuestion } as never);
    try {
      const invoke = async (type: 'admin' | 'user') => {
        const base = await request(type);
        return POST(new NextRequest(base.url, { method: 'POST', headers: base.headers, body: JSON.stringify({ topicId: '11111111-1111-4111-8111-111111111111', questionText: 'Question', options: ['A'] }) }), undefined);
      };
      expect((await invoke('user')).status).toBe(401); expect(createQuestion).not.toHaveBeenCalled();
      expect((await invoke('admin')).status).toBe(200);
      expect(createQuestion).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ questionText: 'Question' }), 'principal');
    } finally { container.register(AdminQuestionEngine, previousEngine); }
  });
  it('denies learner before query dispatch', async () => {
    const response = await GET(await request('user'), undefined);
    expect.soft(response.status).toBe(401); expect.soft(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' }); expect(queryBus.dispatch).not.toHaveBeenCalled();
  });
  it('rejects malformed question payloads before engine writes and preserves supported types', async () => {
    const createQuestion = vi.fn(async (value: unknown) => value);
    const previousEngine = container.get(AdminQuestionEngine);
    container.register(AdminQuestionEngine, { createQuestion } as never);
    try {
      const base = await request('admin');
      const invoke = (body: unknown) => POST(new NextRequest(base.url, { method: 'POST', headers: base.headers, body: JSON.stringify(body) }), undefined);
      const valid = { topicId: '11111111-1111-4111-8111-111111111111', questionText: 'Question', options: ['A'] };
      expect((await invoke({ ...valid, type: 'invalid' })).status).toBe(400);
      expect((await invoke({ ...valid, options: [] })).status).toBe(400);
      expect(createQuestion).not.toHaveBeenCalled();
      for (const type of ['mcq', 'code_mcq', 'multi_select']) {
        expect((await invoke({ ...valid, type })).status).toBe(200);
        expect(createQuestion).toHaveBeenLastCalledWith(expect.objectContaining({ type }), 'principal');
      }
      expect(createQuestion).toHaveBeenCalledTimes(3);
    } finally { container.register(AdminQuestionEngine, previousEngine); }
  });
});
