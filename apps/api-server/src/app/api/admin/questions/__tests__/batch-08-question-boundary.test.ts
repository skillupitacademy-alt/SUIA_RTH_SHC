import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryBus } from '@/lib/cqrs';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET } from '../route';

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
  it('denies learner before query dispatch', async () => {
    const response = await GET(await request('user'), undefined);
    expect.soft(response.status).toBe(401); expect.soft(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' }); expect(queryBus.dispatch).not.toHaveBeenCalled();
  });
});
